import { Injectable, NotFoundException } from '@nestjs/common';
import { MeetupStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type HomeMeetup = Prisma.MeetupGetPayload<{
  include: {
    reviews: { select: { rating: true } };
    _count: { select: { applications: true } };
  };
}>;

type HomeApplication = Prisma.MeetupApplicationGetPayload<{
  include: {
    meetup: {
      select: {
        id: true;
        title: true;
        imageUrl: true;
        startsAt: true;
        status: true;
      };
    };
  };
}>;

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getHome(userId: string) {
    const [user, upcomingMeetups, myMeetups] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          wallet: true,
          dorriAccount: true,
        },
      }),
      this.prisma.meetup.findMany({
        where: {
          status: MeetupStatus.PUBLISHED,
          startsAt: { gte: new Date() },
        },
        include: {
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { startsAt: 'asc' },
        take: 10,
      }),
      this.prisma.meetupApplication.findMany({
        where: {
          userId,
          status: { not: 'CANCELED' },
        },
        include: {
          meetup: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              startsAt: true,
              status: true,
            },
          },
        },
        orderBy: { appliedAt: 'desc' },
        take: 10,
      }),
    ]);

    if (!user) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'User was not found',
      });
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        profileImageUrl: user.profileImageUrl,
      },
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
      upcomingMeetups: upcomingMeetups.map((meetup) => this.toUpcomingMeetup(meetup)),
      myMeetups: myMeetups.map((application) => this.toMyMeetup(application)),
    };
  }

  private toUpcomingMeetup(meetup: HomeMeetup) {
    return {
      id: meetup.id,
      title: meetup.title,
      hostName: meetup.hostName,
      imageUrl: meetup.imageUrl,
      locationName: meetup.locationName,
      startsAt: meetup.startsAt.toISOString(),
      type: meetup.type,
      depositDorri: this.formatDecimal(meetup.depositDorri),
      entryFeeDorri: this.formatDecimal(meetup.entryFeeDorri),
      capacity: meetup.capacity,
      appliedCount: meetup._count.applications,
      rating: this.averageRating(meetup.reviews),
    };
  }

  private toMyMeetup(application: HomeApplication) {
    return {
      applicationId: application.id,
      status: application.status,
      lockedDorriAmount: this.formatDecimal(application.lockedDorriAmount),
      meetup: {
        id: application.meetup.id,
        title: application.meetup.title,
        imageUrl: application.meetup.imageUrl,
        startsAt: application.meetup.startsAt.toISOString(),
        status: application.meetup.status,
      },
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
}
