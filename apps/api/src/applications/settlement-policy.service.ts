import { Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  MeetupType,
  Prisma,
  ReputationEventType,
  SettlementLineType,
  SettlementReason,
} from '@prisma/client';

type SettlementScenario = 'ATTENDED' | 'CANCELED' | 'NO_SHOW' | 'REJECTED';
type CancellationWindow = '48H_PLUS' | '24_48' | 'WITHIN_24';

export type SettlementPolicyLine = {
  type: SettlementLineType;
  recipient: 'PARTICIPANT' | 'HOST' | 'PLATFORM';
  amountDorri: Prisma.Decimal;
};

export type SettlementPolicyResult = {
  reason: SettlementReason;
  reputation:
    | {
        type: ReputationEventType;
        delta: Prisma.Decimal;
      }
    | null;
  lines: SettlementPolicyLine[];
};

@Injectable()
export class SettlementPolicyService {
  resolve(params: {
    meetupType: MeetupType;
    applicationStatus: ApplicationStatus;
    lockedDorriAmount: Prisma.Decimal;
    startsAt: Date;
    now?: Date;
  }): SettlementPolicyResult {
    const scenario = this.resolveScenario(params.applicationStatus);
    const now = params.now ?? new Date();

    if (scenario === 'REJECTED') {
      return {
        reason: SettlementReason.REJECTED,
        reputation: null,
        lines: [
          {
            type: SettlementLineType.PARTICIPANT_REFUND,
            recipient: 'PARTICIPANT',
            amountDorri: params.lockedDorriAmount,
          },
        ],
      };
    }

    if (params.meetupType === MeetupType.FREE) {
      return this.resolveFreePolicy({
        scenario,
        lockedDorriAmount: params.lockedDorriAmount,
        cancellationWindow: scenario === 'CANCELED' ? this.getCancellationWindow(params.startsAt, now) : null,
      });
    }

    return this.resolvePaidPolicy({
      scenario,
      lockedDorriAmount: params.lockedDorriAmount,
      cancellationWindow: scenario === 'CANCELED' ? this.getCancellationWindow(params.startsAt, now) : null,
    });
  }

  private resolveScenario(status: ApplicationStatus): SettlementScenario {
    if (status === ApplicationStatus.REVIEWED) {
      return 'ATTENDED';
    }

    if (status === ApplicationStatus.NO_SHOW) {
      return 'NO_SHOW';
    }

    if (status === ApplicationStatus.CANCELED) {
      return 'CANCELED';
    }

    if (status === ApplicationStatus.REJECTED) {
      return 'REJECTED';
    }

    throw new Error(`Unsupported settlement status: ${status}`);
  }

  private resolveFreePolicy(params: {
    scenario: SettlementScenario;
    lockedDorriAmount: Prisma.Decimal;
    cancellationWindow: CancellationWindow | null;
  }): SettlementPolicyResult {
    if (params.scenario === 'ATTENDED') {
      return {
        reason: SettlementReason.FREE_ATTENDED,
        reputation: { type: ReputationEventType.ATTENDANCE, delta: new Prisma.Decimal('0.1') },
        lines: [this.participantRefund(params.lockedDorriAmount)],
      };
    }

    if (params.scenario === 'NO_SHOW') {
      return {
        reason: SettlementReason.FREE_NO_SHOW,
        reputation: { type: ReputationEventType.NO_SHOW, delta: new Prisma.Decimal('-0.5') },
        lines: [
          this.participantRefund(this.percent(params.lockedDorriAmount, 50)),
          this.hostPayout(SettlementLineType.NO_SHOW_PENALTY, this.percent(params.lockedDorriAmount, 50)),
        ],
      };
    }

    if (params.cancellationWindow === '48H_PLUS') {
      return {
        reason: SettlementReason.FREE_CANCELED_48H_PLUS,
        reputation: { type: ReputationEventType.CANCEL_48H_PLUS, delta: new Prisma.Decimal(0) },
        lines: [this.participantRefund(params.lockedDorriAmount)],
      };
    }

    if (params.cancellationWindow === '24_48') {
      return {
        reason: SettlementReason.FREE_CANCELED_24_48,
        reputation: { type: ReputationEventType.CANCEL_24_48, delta: new Prisma.Decimal('-0.1') },
        lines: [
          this.participantRefund(this.percent(params.lockedDorriAmount, 90)),
          this.hostPayout(SettlementLineType.HOST_PAYOUT, this.percent(params.lockedDorriAmount, 10)),
        ],
      };
    }

    return {
      reason: SettlementReason.FREE_CANCELED_WITHIN_24,
      reputation: { type: ReputationEventType.CANCEL_WITHIN_24, delta: new Prisma.Decimal('-0.3') },
      lines: [
        this.participantRefund(this.percent(params.lockedDorriAmount, 70)),
        this.hostPayout(SettlementLineType.HOST_PAYOUT, this.percent(params.lockedDorriAmount, 30)),
      ],
    };
  }

  private resolvePaidPolicy(params: {
    scenario: SettlementScenario;
    lockedDorriAmount: Prisma.Decimal;
    cancellationWindow: CancellationWindow | null;
  }): SettlementPolicyResult {
    if (params.scenario === 'ATTENDED') {
      return {
        reason: SettlementReason.PAID_ATTENDED,
        reputation: { type: ReputationEventType.ATTENDANCE, delta: new Prisma.Decimal('0.1') },
        lines: this.paidHostAndFee(params.lockedDorriAmount, 90, 10),
      };
    }

    if (params.scenario === 'NO_SHOW') {
      return {
        reason: SettlementReason.PAID_NO_SHOW,
        reputation: { type: ReputationEventType.NO_SHOW, delta: new Prisma.Decimal('-0.5') },
        lines: this.paidHostAndFee(params.lockedDorriAmount, 90, 10),
      };
    }

    if (params.cancellationWindow === '48H_PLUS') {
      return {
        reason: SettlementReason.PAID_CANCELED_48H_PLUS,
        reputation: { type: ReputationEventType.CANCEL_48H_PLUS, delta: new Prisma.Decimal(0) },
        lines: [
          this.participantRefund(this.percent(params.lockedDorriAmount, 90)),
          this.platformFee(this.percent(params.lockedDorriAmount, 10)),
        ],
      };
    }

    if (params.cancellationWindow === '24_48') {
      return {
        reason: SettlementReason.PAID_CANCELED_24_48,
        reputation: { type: ReputationEventType.CANCEL_24_48, delta: new Prisma.Decimal('-0.1') },
        lines: [
          this.participantRefund(this.percent(params.lockedDorriAmount, 70)),
          this.hostPayout(SettlementLineType.HOST_PAYOUT, this.percent(params.lockedDorriAmount, 20)),
          this.platformFee(this.percent(params.lockedDorriAmount, 10)),
        ],
      };
    }

    return {
      reason: SettlementReason.PAID_CANCELED_WITHIN_24,
      reputation: { type: ReputationEventType.CANCEL_WITHIN_24, delta: new Prisma.Decimal('-0.3') },
      lines: [
        this.participantRefund(this.percent(params.lockedDorriAmount, 50)),
        this.hostPayout(SettlementLineType.HOST_PAYOUT, this.percent(params.lockedDorriAmount, 40)),
        this.platformFee(this.percent(params.lockedDorriAmount, 10)),
      ],
    };
  }

  private getCancellationWindow(startsAt: Date, now: Date): CancellationWindow {
    const hoursUntilStart = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilStart >= 48) {
      return '48H_PLUS';
    }

    if (hoursUntilStart >= 24) {
      return '24_48';
    }

    return 'WITHIN_24';
  }

  private paidHostAndFee(amount: Prisma.Decimal, hostPercent: number, feePercent: number) {
    return [
      this.hostPayout(SettlementLineType.HOST_PAYOUT, this.percent(amount, hostPercent)),
      this.platformFee(this.percent(amount, feePercent)),
    ];
  }

  private participantRefund(amountDorri: Prisma.Decimal): SettlementPolicyLine {
    return {
      type: SettlementLineType.PARTICIPANT_REFUND,
      recipient: 'PARTICIPANT',
      amountDorri,
    };
  }

  private hostPayout(type: SettlementLineType, amountDorri: Prisma.Decimal): SettlementPolicyLine {
    return {
      type,
      recipient: 'HOST',
      amountDorri,
    };
  }

  private platformFee(amountDorri: Prisma.Decimal): SettlementPolicyLine {
    return {
      type: SettlementLineType.PLATFORM_FEE,
      recipient: 'PLATFORM',
      amountDorri,
    };
  }

  private percent(amount: Prisma.Decimal, percent: number) {
    return amount.mul(percent).div(100).toDecimalPlaces(6);
  }
}
