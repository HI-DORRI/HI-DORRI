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
  SettlementLineType,
} from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { SettlementPolicyLine, SettlementPolicyService } from './settlement-policy.service';

type ApplicationListItem = Prisma.MeetupApplicationGetPayload<{
  include: {
    meetup: {
      select: {
        id: true;
        title: true;
        imageUrl: true;
        startsAt: true;
        locationName: true;
      };
    };
    escrow: {
      select: {
        status: true;
        createTxHash: true;
      };
    };
  };
}>;

type ApplicationDetail = Prisma.MeetupApplicationGetPayload<{
  include: {
    meetup: {
      select: {
        id: true;
        title: true;
        type: true;
        startsAt: true;
        locationName: true;
      };
    };
    escrow: true;
    review: {
      select: {
        id: true;
        rating: true;
        tags: true;
        comment: true;
        createdAt: true;
      };
    };
    settlement: {
      include: {
        lines: true;
      };
    };
  };
}>;

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly xrplService: XrplService,
    private readonly settlementPolicy: SettlementPolicyService,
  ) {}

  async getMyApplications(userId: string) {
    const applications = await this.prisma.meetupApplication.findMany({
      where: { userId },
      include: {
        meetup: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            startsAt: true,
            locationName: true,
          },
        },
        escrow: {
          select: {
            status: true,
            createTxHash: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    return {
      applications: applications.map((application) => this.toListItem(application)),
    };
  }

  async getApplication(id: string, userId: string) {
    const application = await this.prisma.meetupApplication.findUnique({
      where: { id },
      include: {
        meetup: {
          select: {
            id: true,
            title: true,
            type: true,
            startsAt: true,
            locationName: true,
          },
        },
        escrow: true,
        review: {
          select: {
            id: true,
            rating: true,
            tags: true,
            comment: true,
            createdAt: true,
          },
        },
        settlement: {
          include: {
            lines: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Application was not found',
      });
    }

    if (application.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Application belongs to another user',
      });
    }

    return this.toDetail(application);
  }

  async createReview(applicationId: string, userId: string, dto: CreateReviewDto) {
    const application = await this.getOwnedApplication(applicationId, userId);

    if (application.status !== ApplicationStatus.CHECKED_IN) {
      throw this.invalidState('Only checked-in applications can be reviewed');
    }

    if (application.review) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Review already exists',
      });
    }

    const [review, updated] = await this.prisma.$transaction([
      this.prisma.review.create({
        data: {
          applicationId: application.id,
          meetupId: application.meetupId,
          userId,
          rating: dto.rating,
          tags: dto.tags,
          comment: dto.comment,
        },
      }),
      this.prisma.meetupApplication.update({
        where: { id: application.id },
        data: {
          status: ApplicationStatus.REVIEWED,
          reviewedAt: new Date(),
        },
      }),
    ]);

    return {
      review: {
        id: review.id,
        applicationId: review.applicationId,
        meetupId: review.meetupId,
        rating: review.rating,
        tags: review.tags,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      },
      application: {
        id: updated.id,
        status: updated.status,
      },
      nextStep: 'SETTLE_ESCROW',
    };
  }

  async cancel(applicationId: string, userId: string) {
    const application = await this.getSettleApplication(applicationId);

    if (application.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Application belongs to another user',
      });
    }

    if (
      application.status !== ApplicationStatus.PENDING_APPROVAL &&
      application.status !== ApplicationStatus.APPROVED
    ) {
      throw this.invalidState('Only pending or approved applications can be canceled');
    }

    if (application.meetup.startsAt <= new Date()) {
      throw this.invalidState('Applications cannot be canceled after meetup start time');
    }

    return this.executeSettlement({
      application: {
        ...application,
        status: ApplicationStatus.CANCELED,
      },
      policyStatus:
        application.status === ApplicationStatus.PENDING_APPROVAL
          ? ApplicationStatus.REJECTED
          : ApplicationStatus.CANCELED,
      finalStatus: ApplicationStatus.CANCELED,
      settledAt: new Date(),
      statusTimestamps: { canceledAt: new Date() },
    });
  }

  async settle(applicationId: string, userId: string) {
    const application = await this.getSettleApplication(applicationId);

    this.assertParticipantOrOrganizer(application, userId);

    if (
      application.status !== ApplicationStatus.REVIEWED &&
      application.status !== ApplicationStatus.NO_SHOW
    ) {
      throw this.invalidState('Only reviewed or no-show applications can be settled');
    }

    if (application.settlement) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Application is already settled',
      });
    }

    if (!application.escrow) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Escrow was not found',
      });
    }

    return this.executeSettlement({
      application,
      finalStatus: ApplicationStatus.SETTLED,
      settledAt: new Date(),
      statusTimestamps: {},
    });
  }

  async getSettlement(applicationId: string, userId: string) {
    const application = await this.prisma.meetupApplication.findUnique({
      where: { id: applicationId },
      include: {
        meetup: true,
        user: { include: { dorriAccount: true } },
        settlement: { include: { lines: true } },
        escrow: true,
      },
    });

    if (!application) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Application was not found',
      });
    }

    this.assertParticipantOrOrganizer(application, userId);

    if (!application.settlement) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Settlement was not found',
      });
    }

    return {
      settlement: this.toSettlement(application.settlement),
      meetup: {
        id: application.meetup.id,
        title: application.meetup.title,
      },
      balance: {
        dorri: application.user.dorriAccount
          ? this.formatDecimal(application.user.dorriAccount.balanceSnapshot)
          : '0',
      },
      escrowTx: application.escrow?.finishTxHash
        ? {
            txHash: application.escrow.finishTxHash,
            explorerUrl: this.createExplorerUrl(application.escrow.finishTxHash),
          }
        : null,
    };
  }

  private toListItem(application: ApplicationListItem) {
    return {
      id: application.id,
      status: application.status,
      lockedDorriAmount: this.formatDecimal(application.lockedDorriAmount),
      meetup: {
        id: application.meetup.id,
        title: application.meetup.title,
        imageUrl: application.meetup.imageUrl,
        startsAt: application.meetup.startsAt.toISOString(),
        locationName: application.meetup.locationName,
      },
      escrow: application.escrow
        ? {
            status: application.escrow.status,
            createTxHash: application.escrow.createTxHash,
          }
        : null,
    };
  }

  private toDetail(application: ApplicationDetail) {
    return {
      id: application.id,
      status: application.status,
      lockedDorriAmount: this.formatDecimal(application.lockedDorriAmount),
      meetup: {
        id: application.meetup.id,
        title: application.meetup.title,
        type: application.meetup.type,
        startsAt: application.meetup.startsAt.toISOString(),
        locationName: application.meetup.locationName,
      },
      escrow: application.escrow
        ? {
            id: application.escrow.id,
            status: application.escrow.status,
            ownerAddress: application.escrow.ownerAddress,
            destinationAddress: application.escrow.destinationAddress,
            offerSequence: application.escrow.offerSequence,
            createTxHash: application.escrow.createTxHash,
            finishTxHash: application.escrow.finishTxHash,
            cancelTxHash: application.escrow.cancelTxHash,
          }
        : null,
      review: application.review
        ? {
            id: application.review.id,
            rating: application.review.rating,
            tags: application.review.tags,
            comment: application.review.comment,
            createdAt: application.review.createdAt.toISOString(),
          }
        : null,
      settlement: application.settlement
        ? {
            id: application.settlement.id,
            status: application.settlement.status,
            reason: application.settlement.reason,
            escrowFinishTxHash: application.settlement.escrowFinishTxHash,
            createdAt: application.settlement.createdAt.toISOString(),
            lines: application.settlement.lines.map((line) => ({
              type: line.type,
              recipientAddress: line.recipientAddress,
              amountDorri: this.formatDecimal(line.amountDorri),
              txHash: line.txHash,
              status: line.status,
            })),
          }
        : null,
    };
  }

  private formatDecimal(value: Prisma.Decimal) {
    return value.toString();
  }

  private async getOwnedApplication(applicationId: string, userId: string) {
    const application = await this.prisma.meetupApplication.findUnique({
      where: { id: applicationId },
      include: { review: true },
    });

    if (!application) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Application was not found',
      });
    }

    if (application.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Application belongs to another user',
      });
    }

    return application;
  }

  private async getSettleApplication(applicationId: string) {
    const application = await this.prisma.meetupApplication.findUnique({
      where: { id: applicationId },
      include: {
        meetup: { include: { organizer: { include: { wallet: true } } } },
        user: { include: { wallet: true, dorriAccount: true } },
        escrow: true,
        settlement: true,
        reputationEvent: true,
      },
    });

    if (!application) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Application was not found',
      });
    }

    return application;
  }

  private assertParticipantOrOrganizer(
    application: { userId: string; meetup: { organizerId: string } },
    userId: string,
  ) {
    if (application.userId !== userId && application.meetup.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Application belongs to another user',
      });
    }
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

  private async getFeeWalletAddress() {
    const wallet = await this.prisma.platformWallet.findUnique({
      where: { kind: PlatformWalletKind.FEE },
    });

    if (!wallet) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Platform fee wallet is not initialized',
      });
    }

    return wallet.xrplAddress;
  }

  private async executeSettlement(params: {
    application: Awaited<ReturnType<ApplicationsService['getSettleApplication']>>;
    policyStatus?: ApplicationStatus;
    finalStatus: ApplicationStatus;
    settledAt: Date;
    statusTimestamps: Partial<Pick<Prisma.MeetupApplicationUpdateInput, 'canceledAt'>>;
  }) {
    const { application, finalStatus, settledAt, statusTimestamps } = params;

    if (!application.escrow) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Escrow was not found',
      });
    }

    const finishTx =
      application.escrow.status === EscrowStatus.FINISHED && application.escrow.finishTxHash
        ? { txHash: application.escrow.finishTxHash, rawJson: null }
        : await this.finishEscrow(application.escrow);
    const policy = this.settlementPolicy.resolve({
      meetupType: application.meetup.type,
      applicationStatus: params.policyStatus ?? application.status,
      lockedDorriAmount: application.lockedDorriAmount,
      startsAt: application.meetup.startsAt,
      now: settledAt,
    });
    const lines = await this.buildSettlementLines(application, policy.lines);
    const updated = await this.prisma.meetupApplication.update({
      where: { id: application.id },
      data: {
        status: finalStatus,
        settledAt,
        ...statusTimestamps,
        escrow: {
          update: {
            status: EscrowStatus.FINISHED,
            finishTxHash: finishTx.txHash,
            finishedAt: settledAt,
          },
        },
        settlement: {
          create: {
            meetupId: application.meetupId,
            status: 'COMPLETED',
            reason: policy.reason,
            escrowFinishTxHash: finishTx.txHash,
            completedAt: settledAt,
            lines: {
              create: lines,
            },
          },
        },
      },
      include: {
        escrow: true,
        settlement: { include: { lines: true } },
      },
    });

    const ledgerCreates: Array<Prisma.LedgerTxCreateManyInput> = [];

    if (finishTx.rawJson) {
      ledgerCreates.push({
        userId: application.userId,
        txHash: finishTx.txHash,
        txType: 'ESCROW_FINISH',
        status: 'VALIDATED',
        rawJson: finishTx.rawJson as Prisma.InputJsonValue,
        validatedAt: settledAt,
      });
    }

    for (const line of lines) {
      if (line.txHash) {
        ledgerCreates.push({
          userId: application.userId,
          txHash: line.txHash,
          txType: 'SETTLEMENT_PAYMENT',
          status: 'VALIDATED',
          validatedAt: settledAt,
        });
      }
    }

    await this.prisma.$transaction([
      ...(ledgerCreates.length
        ? [
            this.prisma.ledgerTx.createMany({
              data: ledgerCreates,
              skipDuplicates: true,
            }),
          ]
        : []),
      ...(policy.reputation
        ? [
            this.prisma.userReputationEvent.create({
              data: {
                userId: application.userId,
                applicationId: application.id,
                type: policy.reputation.type,
                delta: policy.reputation.delta,
                reason: policy.reason,
              },
            }),
            this.prisma.user.update({
              where: { id: application.userId },
              data: {
                reputationScore: {
                  increment: policy.reputation.delta,
                },
              },
            }),
          ]
        : []),
    ]);

    const balance = await this.refreshParticipantBalance(application.userId);

    return {
      settlement: this.toSettlement(updated.settlement),
      application: {
        id: updated.id,
        status: updated.status,
      },
      escrow: updated.escrow
        ? {
            id: updated.escrow.id,
            status: updated.escrow.status,
            finishTxHash: updated.escrow.finishTxHash,
            explorerUrl: this.createExplorerUrl(updated.escrow.finishTxHash ?? finishTx.txHash),
          }
        : null,
      reputation: policy.reputation
        ? {
            delta: this.formatDecimal(policy.reputation.delta),
          }
        : null,
      balance: {
        dorri: balance,
      },
    };
  }

  private async buildSettlementLines(
    application: Awaited<ReturnType<ApplicationsService['getSettleApplication']>>,
    policyLines: SettlementPolicyLine[],
  ) {
    const participantAddress = application.user.wallet?.xrplAddress ?? application.escrow?.ownerAddress;

    if (!participantAddress) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Participant wallet was not found',
      });
    }

    const settlementWallet = await this.getSettlementWallet();
    const issuerAddress = await this.getIssuerAddress();
    const settlementSeed = this.decryptSeed(settlementWallet.encryptedSeed);
    const lines = [];
    let hostAddress: string | null = null;
    let feeAddress: string | null = null;

    for (const policyLine of policyLines) {
      if (policyLine.amountDorri.lte(0)) {
        continue;
      }

      let recipientAddress = participantAddress;

      if (policyLine.recipient === 'HOST') {
        hostAddress = hostAddress ?? this.getHostAddress(application);
        recipientAddress = hostAddress;
      }

      if (policyLine.recipient === 'PLATFORM') {
        feeAddress = feeAddress ?? (await this.getFeeWalletAddress());
        recipientAddress = feeAddress;
      }
      const tx = await this.submitSettlementPayment({
        seed: settlementSeed,
        account: settlementWallet.xrplAddress,
        issuer: issuerAddress,
        destination: recipientAddress,
        amount: this.formatDecimal(policyLine.amountDorri),
      });

      lines.push({
        type: policyLine.type,
        recipientAddress,
        amountDorri: policyLine.amountDorri,
        txHash: tx.txHash,
        status: 'VALIDATED' as const,
        completedAt: new Date(),
      });
    }

    return lines;
  }

  private getHostAddress(application: Awaited<ReturnType<ApplicationsService['getSettleApplication']>>) {
    const hostAddress = application.meetup.organizer.wallet?.xrplAddress;

    if (!hostAddress) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Organizer wallet was not found',
      });
    }

    return hostAddress;
  }

  private toSettlement(
    settlement:
      | (Prisma.SettlementGetPayload<{ include: { lines: true } }> & { lines: Array<{ amountDorri: Prisma.Decimal }> })
      | null,
  ) {
    if (!settlement) {
      return null;
    }

    return {
      id: settlement.id,
      applicationId: settlement.applicationId,
      reason: settlement.reason,
      status: settlement.status,
      createdAt: settlement.createdAt.toISOString(),
      lines: settlement.lines.map((line) => ({
        type: line.type,
        recipientAddress: line.recipientAddress,
        amountDorri: this.formatDecimal(line.amountDorri),
        txHash: line.txHash,
      })),
    };
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

  private createExplorerUrl(txHash: string) {
    return `https://testnet.xrpl.org/transactions/${txHash}`;
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

  private async refreshParticipantBalance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, dorriAccount: true },
    });

    if (!user?.wallet || !user.dorriAccount) {
      return '0';
    }

    try {
      const balance = await this.xrplService.getDorriBalance({
        account: user.wallet.xrplAddress,
        issuer: user.dorriAccount.issuerAddress,
      });
      await this.prisma.dorriAccount.update({
        where: { userId },
        data: {
          balanceSnapshot: new Prisma.Decimal(balance),
          balanceCheckedAt: new Date(),
        },
      });

      return balance;
    } catch (error) {
      return this.formatDecimal(user.dorriAccount.balanceSnapshot);
    }
  }

  private invalidState(message: string) {
    return new BadRequestException({
      code: 'INVALID_REQUEST',
      message,
    });
  }
}
