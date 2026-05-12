import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApplicationStatus,
  EscrowStatus,
  PlatformWalletKind,
  Prisma,
} from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { EvaluateParticipantDto } from './dto/evaluate-participant.dto';

@Injectable()
export class OrganizerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly xrplService: XrplService,
  ) {}

  async getMeetups(userId: string) {
    const meetups = await this.prisma.meetup.findMany({
      where: { organizerId: userId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
        applications: {
          where: { status: ApplicationStatus.SETTLED },
          select: { id: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    return {
      meetups: meetups.map((meetup) => ({
        id: meetup.id,
        title: meetup.title,
        type: meetup.type,
        status: meetup.status,
        startsAt: meetup.startsAt.toISOString(),
        entryFeeDorri: this.formatDecimal(meetup.entryFeeDorri),
        depositDorri: this.formatDecimal(meetup.depositDorri),
        capacity: meetup.capacity,
        appliedCount: meetup._count.applications,
        settledCount: meetup.applications.length,
      })),
    };
  }

  async getApplications(meetupId: string, userId: string) {
    const meetup = await this.getOrganizerMeetup(meetupId, userId);
    const applications = await this.prisma.meetupApplication.findMany({
      where: { meetupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            reputationScore: true,
            wallet: { select: { xrplAddress: true } },
          },
        },
        escrow: {
          select: {
            status: true,
            createTxHash: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        settlement: {
          select: {
            reason: true,
          },
        },
        organizerEvaluation: {
          select: {
            id: true,
            rating: true,
            blocked: true,
            createdAt: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return {
      meetup: {
        id: meetup.id,
        title: meetup.title,
      },
      applications: applications.map((application) => ({
        id: application.id,
        status: application.status,
        lockedDorriAmount: this.formatDecimal(application.lockedDorriAmount),
        participant: {
          id: application.user.id,
          name: application.user.name,
          reputationScore: this.formatDecimal(application.user.reputationScore),
          xrplAddress: application.user.wallet?.xrplAddress ?? null,
        },
        escrow: application.escrow
          ? {
              status: application.escrow.status,
              createTxHash: application.escrow.createTxHash,
            }
          : null,
        settlement: application.settlement
          ? {
              reason: application.settlement.reason,
            }
          : null,
        participantReview: application.review
          ? {
              id: application.review.id,
              rating: application.review.rating,
              comment: application.review.comment,
              createdAt: application.review.createdAt.toISOString(),
            }
          : null,
        organizerEvaluation: application.organizerEvaluation
          ? {
              id: application.organizerEvaluation.id,
              rating: application.organizerEvaluation.rating,
              blocked: application.organizerEvaluation.blocked,
              createdAt: application.organizerEvaluation.createdAt.toISOString(),
            }
          : null,
      })),
    };
  }

  async closeMeetup(meetupId: string, userId: string) {
    const meetup = await this.getOrganizerMeetup(meetupId, userId);

    if (meetup.status === 'CLOSED' || meetup.status === 'SETTLED') {
      throw this.invalidState('Meetup is already closed');
    }

    const updated = await this.prisma.meetup.update({
      where: { id: meetup.id },
      data: { status: 'CLOSED' },
    });
    const hostDepositRefund = await this.tryRefundHostDeposit(updated.id, userId, {
      allowNoEvaluationTargets: true,
    });

    return {
      meetup: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        closedAt: new Date().toISOString(),
      },
      nextStep: 'REVIEW_AND_SETTLEMENT',
      hostDepositRefund,
    };
  }

  async approve(applicationId: string, userId: string) {
    const application = await this.getOrganizerApplication(applicationId, userId);

    if (application.status !== ApplicationStatus.PENDING_APPROVAL) {
      throw this.invalidState('Only pending applications can be approved');
    }

    const updated = await this.prisma.meetupApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.APPROVED,
        approvedAt: new Date(),
      },
      include: { escrow: true },
    });

    return {
      application: {
        id: updated.id,
        status: updated.status,
        approvedAt: updated.approvedAt?.toISOString() ?? null,
      },
      escrow: updated.escrow
        ? {
            id: updated.escrow.id,
            status: updated.escrow.status,
          }
        : null,
    };
  }

  async reject(applicationId: string, userId: string) {
    const application = await this.getOrganizerApplication(applicationId, userId);

    if (
      application.status !== ApplicationStatus.PENDING_APPROVAL &&
      application.status !== ApplicationStatus.APPROVED
    ) {
      throw this.invalidState('Only pending or approved applications can be rejected');
    }

    if (!application.escrow) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Escrow was not found',
      });
    }

    if (application.settlement) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Application is already settled',
      });
    }

    const finishTx = await this.finishEscrow(application.escrow);
    const settlementWallet = await this.getSettlementWallet();
    const issuerAddress = await this.getIssuerAddress();
    const refundTx = await this.submitSettlementPayment({
      seed: this.decryptSeed(settlementWallet.encryptedSeed),
      account: settlementWallet.xrplAddress,
      issuer: issuerAddress,
      destination: application.user.wallet?.xrplAddress ?? application.escrow.ownerAddress,
      amount: this.formatDecimal(application.lockedDorriAmount),
    });
    const now = new Date();
    const updated = await this.prisma.meetupApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.SETTLED,
        rejectedAt: application.rejectedAt ?? now,
        settledAt: now,
        escrow: {
          update: {
            status: EscrowStatus.FINISHED,
            finishTxHash: finishTx.txHash,
            finishedAt: now,
          },
        },
        settlement: {
          create: {
            meetupId: application.meetupId,
            status: 'COMPLETED',
            reason: 'REJECTED',
            escrowFinishTxHash: finishTx.txHash,
            completedAt: now,
            lines: {
              create: {
                type: 'PARTICIPANT_REFUND',
                recipientAddress: application.user.wallet?.xrplAddress ?? application.escrow.ownerAddress,
                amountDorri: application.lockedDorriAmount,
                txHash: refundTx.txHash,
                status: 'VALIDATED',
                completedAt: now,
              },
            },
          },
        },
      },
      include: {
        escrow: true,
        settlement: { include: { lines: true } },
      },
    });

    await this.prisma.ledgerTx.createMany({
      data: [
        {
          userId: application.userId,
          txHash: finishTx.txHash,
          txType: 'ESCROW_FINISH',
          status: 'VALIDATED',
          rawJson: finishTx.rawJson as Prisma.InputJsonValue,
          validatedAt: now,
        },
        {
          userId: application.userId,
          txHash: refundTx.txHash,
          txType: 'SETTLEMENT_PAYMENT',
          status: 'VALIDATED',
          rawJson: refundTx.rawJson as Prisma.InputJsonValue,
          validatedAt: now,
        },
      ],
      skipDuplicates: true,
    });

    return {
      application: {
        id: updated.id,
        status: updated.status,
      },
      escrow: updated.escrow
        ? {
            id: updated.escrow.id,
            status: updated.escrow.status,
            finishTxHash: updated.escrow.finishTxHash,
          }
        : null,
      settlement: updated.settlement
        ? {
            id: updated.settlement.id,
            status: updated.settlement.status,
            reason: updated.settlement.reason,
            lines: updated.settlement.lines.map((line) => ({
              type: line.type,
              recipientAddress: line.recipientAddress,
              amountDorri: this.formatDecimal(line.amountDorri),
              txHash: line.txHash,
            })),
          }
        : null,
    };
  }

  async checkIn(applicationId: string, userId: string) {
    const application = await this.getOrganizerApplication(applicationId, userId);

    if (application.status !== ApplicationStatus.APPROVED) {
      throw this.invalidState('Only approved applications can be checked in');
    }

    const updated = await this.prisma.meetupApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.CHECKED_IN,
        checkedInAt: new Date(),
      },
    });

    return {
      application: {
        id: updated.id,
        status: updated.status,
        checkedInAt: updated.checkedInAt?.toISOString() ?? null,
      },
      nextStep: 'SUBMIT_REVIEW',
    };
  }

  async noShow(applicationId: string, userId: string) {
    const application = await this.getOrganizerApplication(applicationId, userId);

    if (
      application.status !== ApplicationStatus.APPROVED &&
      application.status !== ApplicationStatus.CHECKED_IN
    ) {
      throw this.invalidState('Only approved or checked-in applications can be marked no-show');
    }

    const updated = await this.prisma.meetupApplication.update({
      where: { id: application.id },
      data: {
        status: ApplicationStatus.NO_SHOW,
        noShowAt: new Date(),
      },
    });

    return {
      application: {
        id: updated.id,
        status: updated.status,
        noShowAt: updated.noShowAt?.toISOString() ?? null,
      },
      nextStep: 'SETTLE_ESCROW',
    };
  }

  async evaluateParticipant(applicationId: string, userId: string, dto: EvaluateParticipantDto) {
    const application = await this.getOrganizerApplication(applicationId, userId);

    if (
      application.status !== ApplicationStatus.CHECKED_IN &&
      application.status !== ApplicationStatus.REVIEWED &&
      application.status !== ApplicationStatus.NO_SHOW &&
      application.status !== ApplicationStatus.SETTLED
    ) {
      throw this.invalidState('Only checked-in, reviewed, no-show, or settled applications can be evaluated');
    }

    const existingEvaluation = await this.prisma.organizerParticipantEvaluation.findUnique({
      where: { applicationId: application.id },
    });

    if (existingEvaluation) {
      throw new ConflictException('This participant has already been evaluated');
    }

    const evaluation = await this.prisma.organizerParticipantEvaluation.create({
      data: {
        applicationId: application.id,
        organizerId: userId,
        participantId: application.userId,
        rating: dto.rating,
        tags: dto.tags,
        comment: dto.comment,
        blocked: Boolean(dto.blocked),
        blockReason: dto.blockReason,
      },
    });

    const block =
      dto.blocked === true
        ? await this.prisma.userBlock.upsert({
            where: {
              blockerId_blockedUserId: {
                blockerId: userId,
                blockedUserId: application.userId,
              },
            },
            create: {
              blockerId: userId,
              blockedUserId: application.userId,
              applicationId: application.id,
              reason: dto.blockReason,
            },
            update: {
              applicationId: application.id,
              reason: dto.blockReason,
            },
          })
        : null;

    const hostDepositRefund = await this.tryRefundHostDeposit(application.meetupId, userId);

    return {
      evaluation: {
        id: evaluation.id,
        applicationId: evaluation.applicationId,
        rating: evaluation.rating,
        tags: evaluation.tags,
        comment: evaluation.comment,
        blocked: evaluation.blocked,
        blockReason: evaluation.blockReason,
        createdAt: evaluation.createdAt.toISOString(),
      },
      block: block
        ? {
            id: block.id,
            blockedUserId: block.blockedUserId,
            reason: block.reason,
          }
        : null,
      hostDepositRefund,
    };
  }

  private async tryRefundHostDeposit(
    meetupId: string,
    organizerId: string,
    options: { allowNoEvaluationTargets?: boolean } = {},
  ) {
    const meetup = await this.prisma.meetup.findUnique({
      where: { id: meetupId },
      include: {
        organizer: { include: { wallet: true } },
        hostEscrow: true,
        applications: {
          include: {
            organizerEvaluation: true,
            settlement: { select: { reason: true } },
          },
        },
      },
    });

    if (
      !meetup ||
      meetup.organizerId !== organizerId ||
      meetup.type !== 'PAID' ||
      meetup.status !== 'CLOSED' ||
      !meetup.hostEscrow ||
      meetup.hostEscrow.status !== EscrowStatus.CREATED ||
      meetup.hostEscrow.refundedAt
    ) {
      return null;
    }

    const evaluationTargets = meetup.applications.filter((application) =>
      this.isHostEvaluationTarget(application),
    );

    if (evaluationTargets.length === 0 && options.allowNoEvaluationTargets !== true) {
      return null;
    }

    const allEvaluated = evaluationTargets.every((application) => application.organizerEvaluation);

    if (!allEvaluated) {
      return null;
    }

    const settlementWallet = await this.getSettlementWallet();
    const issuerAddress = await this.getIssuerAddress();
    const finishTx = await this.finishEscrow(meetup.hostEscrow);
    const refundTx = await this.submitSettlementPayment({
      seed: this.decryptSeed(settlementWallet.encryptedSeed),
      account: settlementWallet.xrplAddress,
      issuer: issuerAddress,
      destination: meetup.organizer.wallet?.xrplAddress ?? meetup.hostEscrow.ownerAddress,
      amount: this.formatDecimal(meetup.hostEscrow.lockedDorriAmount),
    });
    await this.refreshDorriBalanceSnapshot(
      organizerId,
      meetup.organizer.wallet?.xrplAddress ?? meetup.hostEscrow.ownerAddress,
      issuerAddress,
    );
    const now = new Date();

    const updatedEscrow = await this.prisma.hostMeetupEscrow.update({
      where: { id: meetup.hostEscrow.id },
      data: {
        status: EscrowStatus.FINISHED,
        finishTxHash: finishTx.txHash,
        finishedAt: now,
        refundedAt: now,
      },
    });

    await this.prisma.ledgerTx.createMany({
      data: [
        {
          userId: organizerId,
          txHash: finishTx.txHash,
          txType: 'ESCROW_FINISH',
          status: 'VALIDATED',
          rawJson: finishTx.rawJson as Prisma.InputJsonValue,
          validatedAt: now,
        },
        {
          userId: organizerId,
          txHash: refundTx.txHash,
          txType: 'SETTLEMENT_PAYMENT',
          status: 'VALIDATED',
          rawJson: refundTx.rawJson as Prisma.InputJsonValue,
          validatedAt: now,
        },
      ],
      skipDuplicates: true,
    });

    return {
      escrow: {
        id: updatedEscrow.id,
        status: updatedEscrow.status,
        lockedDorriAmount: this.formatDecimal(updatedEscrow.lockedDorriAmount),
        finishTxHash: updatedEscrow.finishTxHash,
        refundedAt: updatedEscrow.refundedAt?.toISOString() ?? null,
      },
      refund: {
        txHash: refundTx.txHash,
        amountDorri: this.formatDecimal(updatedEscrow.lockedDorriAmount),
      },
    };
  }

  private isHostEvaluationTarget(application: {
    status: ApplicationStatus;
    settlement: { reason: string } | null;
  }) {
    if (
      application.status === ApplicationStatus.CHECKED_IN ||
      application.status === ApplicationStatus.NO_SHOW ||
      application.status === ApplicationStatus.REVIEWED
    ) {
      return true;
    }

    if (application.status !== ApplicationStatus.SETTLED || !application.settlement) {
      return false;
    }

    return ['FREE_ATTENDED', 'FREE_NO_SHOW', 'PAID_ATTENDED', 'PAID_NO_SHOW'].includes(
      application.settlement.reason,
    );
  }

  private async getOrganizerMeetup(meetupId: string, userId: string) {
    const meetup = await this.prisma.meetup.findUnique({
      where: { id: meetupId },
    });

    if (!meetup) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Meetup was not found',
      });
    }

    if (meetup.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Meetup belongs to another organizer',
      });
    }

    return meetup;
  }

  private async getOrganizerApplication(applicationId: string, userId: string) {
    const application = await this.prisma.meetupApplication.findUnique({
      where: { id: applicationId },
      include: {
        meetup: true,
        user: { include: { wallet: true } },
        escrow: true,
        settlement: true,
      },
    });

    if (!application) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Application was not found',
      });
    }

    if (application.meetup.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Application belongs to another organizer',
      });
    }

    return application;
  }

  private async finishEscrow(escrow: {
    ownerAddress: string;
    offerSequence: number;
    condition: string | null;
    fulfillmentEncrypted: string | null;
    status: EscrowStatus;
  }) {
    if (escrow.status === EscrowStatus.FINISHED) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Escrow is already finished',
      });
    }

    const settlementWallet = await this.getSettlementWallet();

    try {
      return await this.xrplService.finishXrpEscrow({
        seed: this.decryptSeed(settlementWallet.encryptedSeed),
        account: settlementWallet.xrplAddress,
        owner: escrow.ownerAddress,
        offerSequence: escrow.offerSequence,
        condition: escrow.condition ?? undefined,
        fulfillment: escrow.fulfillmentEncrypted
          ? this.decryptSeed(escrow.fulfillmentEncrypted)
          : undefined,
      });
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'XRPL escrow finish transaction failed',
      });
    }
  }

  private async getSettlementWallet() {
    const wallet = await this.prisma.platformWallet.findUnique({
      where: { kind: PlatformWalletKind.SETTLEMENT },
    });

    if (!wallet?.encryptedSeed) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Platform settlement wallet is not initialized',
      });
    }

    return {
      ...wallet,
      encryptedSeed: wallet.encryptedSeed,
    };
  }

  private async getIssuerAddress() {
    const wallet = await this.prisma.platformWallet.findUnique({
      where: { kind: PlatformWalletKind.DORRI_ISSUER },
    });

    if (!wallet) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'DORRI issuer platform wallet is not initialized',
      });
    }

    return wallet.xrplAddress;
  }

  private async submitSettlementPayment(params: {
    seed: string;
    account: string;
    issuer: string;
    destination: string;
    amount: string;
  }) {
    try {
      return await this.xrplService.sendDorriPayment(params);
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'DORRI settlement payment transaction failed',
      });
    }
  }

  private async refreshDorriBalanceSnapshot(userId: string, account: string, issuer: string) {
    try {
      const balance = await this.xrplService.getDorriBalance({ account, issuer });
      await this.prisma.dorriAccount.update({
        where: { userId },
        data: {
          balanceSnapshot: new Prisma.Decimal(balance),
          balanceCheckedAt: new Date(),
        },
      });
    } catch (error) {
      return;
    }
  }

  private decryptSeed(encryptedValue: string) {
    const [iv, authTag, encrypted] = encryptedValue.split('.');

    if (!iv || !authTag || !encrypted) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Encrypted value could not be decrypted',
      });
    }

    const decipher = createDecipheriv('aes-256-gcm', this.getEncryptionKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString(
      'utf8',
    );
  }

  private getEncryptionKey() {
    const secret = this.config.get<string>('WALLET_ENCRYPTION_KEY') ?? 'local-dev-wallet-encryption-key';

    return createHash('sha256').update(secret).digest();
  }

  private invalidState(message: string) {
    return new BadRequestException({
      code: 'INVALID_REQUEST',
      message,
    });
  }

  private formatDecimal(value: Prisma.Decimal) {
    return value.toString();
  }
}
