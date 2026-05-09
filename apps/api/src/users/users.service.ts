import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        dorriAccount: true,
        applications: {
          include: {
            meetup: {
              select: {
                id: true,
                title: true,
                startsAt: true,
                imageUrl: true,
                locationName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        organizedMeetups: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            status: true,
            capacity: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            applications: true,
            organizedMeetups: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User was not found',
      });
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      emailVerified: Boolean(user.emailVerifiedAt),
      reputationScore: this.formatDecimal(user.reputationScore),
      stats: {
        joinedMeetups: user._count.applications,
        hostedMeetups: user._count.organizedMeetups,
        trustScore: this.formatDecimal(user.reputationScore),
      },
      joinedMeetups: user.applications.map((application) => ({
        applicationId: application.id,
        status: application.status,
        lockedDorriAmount: this.formatDecimal(application.lockedDorriAmount),
        appliedAt: application.appliedAt.toISOString(),
        meetup: {
          id: application.meetup.id,
          title: application.meetup.title,
          startsAt: application.meetup.startsAt.toISOString(),
          imageUrl: application.meetup.imageUrl,
          locationName: application.meetup.locationName,
        },
      })),
      hostedMeetups: user.organizedMeetups.map((meetup) => ({
        id: meetup.id,
        title: meetup.title,
        startsAt: meetup.startsAt.toISOString(),
        status: meetup.status,
        capacity: meetup.capacity,
        appliedCount: meetup._count.applications,
      })),
      wallet: user.wallet
        ? {
            xrplAddress: user.wallet.xrplAddress,
            network: user.wallet.network,
          }
        : null,
      dorri: user.dorriAccount
        ? {
            balance: this.formatDecimal(user.dorriAccount.balanceSnapshot),
            trustLineStatus: user.dorriAccount.trustLineStatus,
          }
        : null,
    };
  }

  private formatDecimal(value: Prisma.Decimal) {
    return value.toString();
  }
}
