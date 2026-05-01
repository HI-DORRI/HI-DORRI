import { EscrowCreate, Payment, TrustSet, xrpToDrops } from 'xrpl';

export function buildDorriTrustSet(params: {
  account: string;
  issuer: string;
  limit: string;
}): TrustSet {
  return {
    TransactionType: 'TrustSet',
    Account: params.account,
    LimitAmount: {
      currency: 'DORRI',
      issuer: params.issuer,
      value: params.limit,
    },
  };
}

export function buildDorriPayment(params: {
  issuer: string;
  destination: string;
  amount: string;
}): Payment {
  return {
    TransactionType: 'Payment',
    Account: params.issuer,
    Destination: params.destination,
    Amount: {
      currency: 'DORRI',
      issuer: params.issuer,
      value: params.amount,
    },
  };
}

export function buildXrpEscrowCreate(params: {
  account: string;
  destination: string;
  amountXrp: string;
  finishAfterRippleTime?: number;
  cancelAfterRippleTime?: number;
}): EscrowCreate {
  return {
    TransactionType: 'EscrowCreate',
    Account: params.account,
    Destination: params.destination,
    Amount: xrpToDrops(params.amountXrp),
    FinishAfter: params.finishAfterRippleTime,
    CancelAfter: params.cancelAfterRippleTime,
  };
}
