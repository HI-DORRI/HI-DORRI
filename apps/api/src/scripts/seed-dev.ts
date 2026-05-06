import { ApplicationStatus, MeetupStatus, MeetupType, Prisma, PrismaClient } from '@prisma/client';
import { createHash, randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

type SeedMeetup = {
  title: string;
  description: string;
  hostName: string;
  imageUrl: string;
  locationName: string;
  address: string;
  mapImageUrl: string;
  startsAt: Date;
  endsAt: Date;
  type: MeetupType;
  depositDorri: string;
  entryFeeDorri: string;
  capacity: number;
  tags: string[];
  reviewRatings: number[];
};

async function main() {
  const host = await upsertUser({
    email: 'host@hi-dorri.dev',
    name: 'Asia Crypto Alliance',
    profileImageUrl: '/images/host-asia-crypto.png',
  });
  const reviewer = await upsertUser({
    email: 'reviewer@hi-dorri.dev',
    name: 'CryptoMagic',
    profileImageUrl: '/images/avatar-cryptomagic.png',
  });
  const participant = await getSeedParticipant();
  const meetups = await seedMeetups(host.id);

  await seedReviews(meetups, reviewer.id);

  if (participant) {
    await seedApplication({
      meetupId: meetups[1]?.id ?? meetups[0]?.id,
      userId: participant.id,
    });
  }

  console.log('Development seed data is ready.');
  console.log(
    JSON.stringify(
      {
        host: host.email,
        participant: participant?.email ?? null,
        meetups: meetups.map((meetup) => ({ id: meetup.id, title: meetup.title })),
      },
      null,
      2,
    ),
  );
}

async function upsertUser(params: { email: string; name: string; profileImageUrl: string }) {
  return prisma.user.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      name: params.name,
      profileImageUrl: params.profileImageUrl,
      passwordHash: hashPassword('password123'),
      emailVerifiedAt: new Date(),
    },
    update: {
      name: params.name,
      profileImageUrl: params.profileImageUrl,
      emailVerifiedAt: new Date(),
    },
  });
}

async function getSeedParticipant() {
  const existingRealUser = await prisma.user.findFirst({
    where: {
      email: {
        notIn: ['host@hi-dorri.dev', 'reviewer@hi-dorri.dev'],
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingRealUser) {
    return existingRealUser;
  }

  return upsertUser({
    email: 'participant@hi-dorri.dev',
    name: 'hidorri',
    profileImageUrl: '/images/avatar-hidorri.png',
  });
}

async function seedMeetups(hostId: string) {
  const seeds = getMeetupSeeds();
  const meetups = [];

  for (const seed of seeds) {
    const meetup = await prisma.meetup.upsert({
      where: { id: createStableId(seed.title) },
      create: {
        id: createStableId(seed.title),
        organizerId: hostId,
        title: seed.title,
        description: seed.description,
        hostName: seed.hostName,
        imageUrl: seed.imageUrl,
        locationName: seed.locationName,
        address: seed.address,
        mapImageUrl: seed.mapImageUrl,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        type: seed.type,
        depositDorri: new Prisma.Decimal(seed.depositDorri),
        entryFeeDorri: new Prisma.Decimal(seed.entryFeeDorri),
        capacity: seed.capacity,
        status: MeetupStatus.PUBLISHED,
      },
      update: {
        organizerId: hostId,
        title: seed.title,
        description: seed.description,
        hostName: seed.hostName,
        imageUrl: seed.imageUrl,
        locationName: seed.locationName,
        address: seed.address,
        mapImageUrl: seed.mapImageUrl,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        type: seed.type,
        depositDorri: new Prisma.Decimal(seed.depositDorri),
        entryFeeDorri: new Prisma.Decimal(seed.entryFeeDorri),
        capacity: seed.capacity,
        status: MeetupStatus.PUBLISHED,
      },
    });

    await prisma.meetupTag.deleteMany({ where: { meetupId: meetup.id } });
    await prisma.meetupTag.createMany({
      data: seed.tags.map((name) => ({
        meetupId: meetup.id,
        name,
      })),
      skipDuplicates: true,
    });

    meetups.push(meetup);
  }

  return meetups;
}

async function seedReviews(meetups: Array<{ id: string }>, reviewerId: string) {
  for (const meetup of meetups) {
    const seed = getMeetupSeeds().find((item) => createStableId(item.title) === meetup.id);

    if (!seed) {
      continue;
    }

    for (const [index, rating] of seed.reviewRatings.entries()) {
      const application = await prisma.meetupApplication.upsert({
        where: {
          meetupId_userId: {
            meetupId: meetup.id,
            userId: index === 0 ? reviewerId : await createReviewerUser(index),
          },
        },
        create: {
          meetupId: meetup.id,
          userId: index === 0 ? reviewerId : await createReviewerUser(index),
          status: ApplicationStatus.REVIEWED,
          lockedDorriAmount: new Prisma.Decimal(seed.type === MeetupType.FREE ? seed.depositDorri : seed.entryFeeDorri),
          checkedInAt: new Date(),
          reviewedAt: new Date(),
        },
        update: {
          status: ApplicationStatus.REVIEWED,
          checkedInAt: new Date(),
          reviewedAt: new Date(),
        },
      });

      await prisma.review.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          meetupId: meetup.id,
          userId: application.userId,
          rating,
          tags: ['Well organized', 'Good networking'],
          comment: 'Seed review for local development.',
        },
        update: {
          rating,
          tags: ['Well organized', 'Good networking'],
          comment: 'Seed review for local development.',
        },
      });
    }
  }
}

async function createReviewerUser(index: number) {
  const user = await upsertUser({
    email: `reviewer${index}@hi-dorri.dev`,
    name: `Seed Reviewer ${index}`,
    profileImageUrl: `/images/avatar-reviewer-${index}.png`,
  });

  return user.id;
}

async function seedApplication(params: { meetupId?: string; userId: string }) {
  if (!params.meetupId) {
    return;
  }

  const meetup = await prisma.meetup.findUnique({
    where: { id: params.meetupId },
  });

  if (!meetup) {
    return;
  }

  await prisma.meetupApplication.upsert({
    where: {
      meetupId_userId: {
        meetupId: meetup.id,
        userId: params.userId,
      },
    },
    create: {
      meetupId: meetup.id,
      userId: params.userId,
      status: ApplicationStatus.APPROVED,
      lockedDorriAmount: meetup.type === MeetupType.FREE ? meetup.depositDorri : meetup.entryFeeDorri,
      approvedAt: new Date(),
    },
    update: {
      status: ApplicationStatus.APPROVED,
      lockedDorriAmount: meetup.type === MeetupType.FREE ? meetup.depositDorri : meetup.entryFeeDorri,
      approvedAt: new Date(),
    },
  });
}

function getMeetupSeeds(): SeedMeetup[] {
  const base = new Date();

  return [
    {
      title: 'Singapore NFT Global Summit',
      description: 'A cross-border gathering for NFT founders, collectors, and community builders.',
      hostName: 'Asia Crypto Alliance',
      imageUrl: '/images/meetup-singapore.png',
      locationName: 'Marina Bay, Singapore',
      address: '10 Bayfront Ave, Singapore',
      mapImageUrl: '/images/map-marina-bay.png',
      startsAt: addDays(base, 4, 13),
      endsAt: addDays(base, 4, 16),
      type: MeetupType.FREE,
      depositDorri: '20',
      entryFeeDorri: '0',
      capacity: 100,
      tags: ['NFT', 'Community', 'Global'],
      reviewRatings: [4, 4, 3],
    },
    {
      title: 'Seoul Crypto Meetup',
      description: 'A crypto-native meetup for builders and community members in Seoul.',
      hostName: 'CryptoMagic',
      imageUrl: '/images/meetup-seoul.png',
      locationName: 'Hongdae, Seoul',
      address: 'Hongdae, Mapo-gu, Seoul',
      mapImageUrl: '/images/map-hongdae.png',
      startsAt: addDays(base, 7, 19),
      endsAt: addDays(base, 7, 21),
      type: MeetupType.PAID,
      depositDorri: '0',
      entryFeeDorri: '30',
      capacity: 20,
      tags: ['Web3', 'Networking'],
      reviewRatings: [5, 5, 4],
    },
    {
      title: 'Busan Web3 Night',
      description: 'An evening session for protocol builders, validators, and on-chain product teams.',
      hostName: 'Korea Chain Labs',
      imageUrl: '/images/meetup-busan.png',
      locationName: 'Haeundae, Busan',
      address: 'Haeundae Beach Road, Busan',
      mapImageUrl: '/images/map-haeundae.png',
      startsAt: addDays(base, 10, 18),
      endsAt: addDays(base, 10, 21),
      type: MeetupType.PAID,
      depositDorri: '0',
      entryFeeDorri: '45',
      capacity: 40,
      tags: ['Validators', 'Builders', 'Korea'],
      reviewRatings: [5, 4, 4],
    },
  ];
}

function addDays(base: Date, days: number, hour: number) {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);

  return date;
}

function createStableId(value: string) {
  return `seed_${createHash('sha1').update(value).digest('hex').slice(0, 18)}`;
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
