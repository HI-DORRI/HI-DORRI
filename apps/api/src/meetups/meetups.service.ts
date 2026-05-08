import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformWalletKind, MeetupStatus, Prisma } from '@prisma/client';
import { createDecipheriv, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { XrplService } from '../xrpl/xrpl.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';

type MeetupWithListRelations = Prisma.MeetupGetPayload<{
  include: {
    reviews: { select: { rating: true } };
    _count: { select: { applications: true } };
  };
}>;

type MeetupWithDetailRelations = Prisma.MeetupGetPayload<{
  include: {
    organizer: { select: { id: true; name: true; profileImageUrl: true } };
    tags: { select: { name: true } };
    reviews: { select: { rating: true } };
    applications: {
      where: { userId: string };
      select: {
        id: true;
        status: true;
        lockedDorriAmount: true;
      };
    };
    _count: { select: { applications: true; reviews: true } };
  };
}>;

@Injectable()
export class MeetupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly xrplService: XrplService,
  ) {}

  async list(status?: MeetupStatus) {
    const resolvedStatus = this.resolveStatus(status);
    const meetups = await this.prisma.meetup.findMany({
      where: { status: resolvedStatus },
      include: {
        reviews: {
          select: { rating: true },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: { startsAt: 'asc' },
    });

    return {
      meetups: meetups.map((meetup) => this.toListItem(meetup)),
    };
  }

  async create(userId: string, dto: CreateMeetupDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User was not found',
      });
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Meetup end time must be after start time',
      });
    }

    const status = dto.status ?? MeetupStatus.PUBLISHED;

    if (status !== MeetupStatus.DRAFT && status !== MeetupStatus.PUBLISHED) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Meetup can only be created as DRAFT or PUBLISHED',
      });
    }

    const amounts = this.resolveMeetupAmounts(dto);
    const meetup = await this.prisma.meetup.create({
      data: {
        organizerId: user.id,
        title: dto.title.trim(),
        description: dto.description.trim(),
        hostName: user.name,
        imageUrl: dto.imageUrl,
        locationName: dto.locationName.trim(),
        address: dto.address.trim(),
        mapImageUrl: dto.mapImageUrl,
        startsAt,
        endsAt,
        type: dto.type,
        depositDorri: amounts.depositDorri,
        entryFeeDorri: amounts.entryFeeDorri,
        capacity: dto.capacity,
        status,
        tags: dto.tags?.length
          ? {
              create: [...new Set(dto.tags.map((tag) => tag.trim()).filter(Boolean))].map((name) => ({
                name,
              })),
            }
          : undefined,
      },
    });

    return {
      id: meetup.id,
      title: meetup.title,
      type: meetup.type,
      status: meetup.status,
      createdAt: meetup.createdAt.toISOString(),
    };
  }

  async detail(id: string, userId: string) {
    const meetup = await this.prisma.meetup.findFirst({
      where: {
        id,
        status: MeetupStatus.PUBLISHED,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        tags: {
          select: { name: true },
          orderBy: { name: 'asc' },
        },
        reviews: {
          select: { rating: true },
        },
        applications: {
          where: { userId },
          select: {
            id: true,
            status: true,
            lockedDorriAmount: true,
          },
          take: 1,
        },
        _count: {
          select: {
            applications: true,
            reviews: true,
          },
        },
      },
    });

    if (!meetup) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Meetup was not found',
      });
    }

    return this.toDetail(meetup);
  }

  async apply(meetupId: string, userId: string) {
    const meetup = await this.prisma.meetup.findFirst({
      where: {
        id: meetupId,
        status: MeetupStatus.PUBLISHED,
      },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!meetup) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Meetup was not found',
      });
    }

    if (meetup._count.applications >= meetup.capacity) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Meetup is full',
      });
    }

    const existingApplication = await this.prisma.meetupApplication.findUnique({
      where: {
        meetupId_userId: {
          meetupId,
          userId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Meetup application already exists',
      });
    }

    const lockedDorriAmount = meetup.type === 'FREE' ? meetup.depositDorri : meetup.entryFeeDorri;
    const [wallet, dorriAccount, settlementWallet] = await Promise.all([
      this.getWallet(userId),
      this.getDorriAccount(userId),
      this.getSettlementWallet(),
    ]);
    const balance = await this.getDorriBalance(wallet.xrplAddress, dorriAccount.issuerAddress);

    if (new Prisma.Decimal(balance).lt(lockedDorriAmount)) {
      throw new InternalServerErrorException({
        code: 'INSUFFICIENT_DORRI_BALANCE',
        message: 'DORRI balance is insufficient',
      });
    }

    const escrowTx = await this.createEscrow({
      seed: this.decryptSeed(wallet.encryptedSeed),
      account: wallet.xrplAddress,
      destination: settlementWallet.xrplAddress,
      amountDorri: this.formatDecimal(lockedDorriAmount),
      issuer: dorriAccount.issuerAddress,
    });
    const application = await this.prisma.meetupApplication.create({
      data: {
        meetupId,
        userId,
        status: 'PENDING_APPROVAL',
        lockedDorriAmount,
        escrow: {
          create: {
            status: 'CREATED',
            ownerAddress: wallet.xrplAddress,
            destinationAddress: settlementWallet.xrplAddress,
            offerSequence: escrowTx.offerSequence,
            lockedDorriAmount,
            amountDrops: null,
            createTxHash: escrowTx.txHash,
            explorerUrl: this.createExplorerUrl(escrowTx.txHash),
            finishAfter: escrowTx.finishAfter,
            cancelAfter: escrowTx.cancelAfter,
          },
        },
      },
      include: {
        escrow: true,
      },
    });

    await this.prisma.ledgerTx.create({
      data: {
        userId,
        txHash: escrowTx.txHash,
        txType: 'ESCROW_CREATE',
        status: 'VALIDATED',
        rawJson: escrowTx.rawJson as Prisma.InputJsonValue,
        validatedAt: new Date(),
      },
    });

    return {
      application: {
        id: application.id,
        meetupId: application.meetupId,
        status: application.status,
        lockedDorriAmount: this.formatDecimal(application.lockedDorriAmount),
        createdAt: application.createdAt.toISOString(),
      },
      escrow: application.escrow
        ? {
            id: application.escrow.id,
            status: application.escrow.status,
            ownerAddress: application.escrow.ownerAddress,
            destinationAddress: application.escrow.destinationAddress,
            offerSequence: application.escrow.offerSequence,
            createTxHash: application.escrow.createTxHash,
            explorerUrl: application.escrow.explorerUrl,
          }
        : null,
      balance: {
        before: balance,
        locked: this.formatDecimal(lockedDorriAmount),
        remain: new Prisma.Decimal(balance).minus(lockedDorriAmount).toString(),
      },
    };
  }

  private resolveStatus(status?: MeetupStatus) {
    if (!status) {
      return MeetupStatus.PUBLISHED;
    }

    if (!Object.values(MeetupStatus).includes(status)) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Meetup status is invalid',
      });
    }

    return status;
  }

  private resolveMeetupAmounts(dto: CreateMeetupDto) {
    if (dto.type === 'FREE') {
      return {
        depositDorri: new Prisma.Decimal(20),
        entryFeeDorri: new Prisma.Decimal(0),
      };
    }

    const entryFeeDorri = new Prisma.Decimal(dto.entryFeeDorri ?? '0');

    if (entryFeeDorri.lte(0)) {
      throw new BadRequestException({
        code: 'INVALID_REQUEST',
        message: 'Paid meetup entry fee must be greater than 0',
      });
    }

    return {
      depositDorri: new Prisma.Decimal(0),
      entryFeeDorri,
    };
  }

  private toListItem(meetup: MeetupWithListRelations) {
    return {
      id: meetup.id,
      title: meetup.title,
      hostName: meetup.hostName ?? null,
      imageUrl: meetup.imageUrl,
      locationName: meetup.locationName,
      startsAt: meetup.startsAt.toISOString(),
      type: meetup.type,
      depositDorri: this.formatDecimal(meetup.depositDorri),
      entryFeeDorri: this.formatDecimal(meetup.entryFeeDorri),
      capacity: meetup.capacity,
      appliedCount: meetup._count.applications,
      rating: this.averageRating(meetup.reviews),
      status: meetup.status,
    };
  }

  private toDetail(meetup: MeetupWithDetailRelations) {
    const myApplication = meetup.applications[0];

    return {
      id: meetup.id,
      title: meetup.title,
      description: meetup.description,
      host: {
        id: meetup.organizer.id,
        name: meetup.hostName ?? meetup.organizer.name,
        profileImageUrl: meetup.organizer.profileImageUrl,
        rating: this.averageRating(meetup.reviews),
        reviewCount: meetup._count.reviews,
      },
      imageUrl: meetup.imageUrl,
      tags: meetup.tags.map((tag) => tag.name),
      location: {
        name: meetup.locationName,
        address: meetup.address,
        mapImageUrl: meetup.mapImageUrl,
      },
      startsAt: meetup.startsAt.toISOString(),
      endsAt: meetup.endsAt.toISOString(),
      type: meetup.type,
      depositDorri: this.formatDecimal(meetup.depositDorri),
      entryFeeDorri: this.formatDecimal(meetup.entryFeeDorri),
      lockedDorriAmount: this.formatDecimal(
        meetup.type === 'FREE' ? meetup.depositDorri : meetup.entryFeeDorri,
      ),
      capacity: meetup.capacity,
      appliedCount: meetup._count.applications,
      status: meetup.status,
      myApplication: myApplication
        ? {
            id: myApplication.id,
            status: myApplication.status,
            lockedDorriAmount: this.formatDecimal(myApplication.lockedDorriAmount),
          }
        : null,
    };
  }

  private averageRating(reviews: Array<{ rating: number }>) {
    if (reviews.length === 0) {
      return 0;
    }

    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    return Math.round(average * 10) / 10;
  }

  private formatDecimal(value: Prisma.Decimal) {
    return value.toString();
  }

  private async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Wallet was not found',
      });
    }

    return wallet;
  }

  private async getDorriAccount(userId: string) {
    const dorriAccount = await this.prisma.dorriAccount.findUnique({
      where: { userId },
    });

    if (!dorriAccount || dorriAccount.trustLineStatus !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'DORRI TrustLine was not found',
      });
    }

    return dorriAccount;
  }

  private async getSettlementWallet() {
    const settlementWallet = await this.prisma.platformWallet.findUnique({
      where: { kind: PlatformWalletKind.SETTLEMENT },
    });

    if (!settlementWallet) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Platform settlement wallet is not initialized',
      });
    }

    return settlementWallet;
  }

  private async getDorriBalance(account: string, issuer: string) {
    try {
      return await this.xrplService.getDorriBalance({ account, issuer });
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'DORRI balance lookup failed',
      });
    }
  }

  private async createEscrow(params: {
    seed: string;
    account: string;
    destination: string;
    amountDorri: string;
    issuer: string;
  }) {
    const finishAfter = new Date(Date.now() + this.getEscrowFinishAfterSeconds() * 1000);
    const cancelAfter = new Date(Date.now() + this.getEscrowCancelAfterSeconds() * 1000);

    try {
      const tx = await this.xrplService.createDorriEscrow({
        seed: params.seed,
        account: params.account,
        destination: params.destination,
        amount: params.amountDorri,
        issuer: params.issuer,
        finishAfterRippleTime: this.toRippleTime(finishAfter),
        cancelAfterRippleTime: this.toRippleTime(cancelAfter),
      });

      return {
        ...tx,
        finishAfter,
        cancelAfter,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        code: 'XRPL_TRANSACTION_FAILED',
        message: 'XRPL DORRI escrow create transaction failed',
      });
    }
  }

  private decryptSeed(encryptedSeed: string) {
    const [iv, authTag, encrypted] = encryptedSeed.split('.');

    if (!iv || !authTag || !encrypted) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Wallet seed could not be decrypted',
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

  private getEscrowFallbackXrp() {
    return this.config.get<string>('XRPL_ESCROW_FALLBACK_XRP') ?? '1';
  }

  private getEscrowFinishAfterSeconds() {
    return this.config.get<number>('XRPL_ESCROW_FINISH_AFTER_SECONDS') ?? 60;
  }

  private getEscrowCancelAfterSeconds() {
    return this.config.get<number>('XRPL_ESCROW_CANCEL_AFTER_SECONDS') ?? 60 * 60 * 24 * 30;
  }

  private toRippleTime(date: Date) {
    return Math.floor(date.getTime() / 1000) - 946684800;
  }

  private createExplorerUrl(txHash: string) {
    return `https://testnet.xrpl.org/transactions/${txHash}`;
  }
}
