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
      emailVerified: Boolean(user.emailVerifiedAt),
      reputationScore: this.formatDecimal(user.reputationScore),
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
