import { EscrowCreate, EscrowFinish, Payment, TrustSet, xrpToDrops } from 'xrpl';

export function buildDorriTrustSet(params: {
  account: string;
  issuer: string;
  limit: string;
  currency: string;
}): TrustSet {
  return {
    TransactionType: 'TrustSet',
    Account: params.account,
    LimitAmount: {
      currency: params.currency,
      issuer: params.issuer,
      value: params.limit,
    },
  };
}

export function buildDorriPayment(params: {
  account: string;
  issuer: string;
  destination: string;
  amount: string;
  currency: string;
}): Payment {
  return {
    TransactionType: 'Payment',
    Account: params.account,
    Destination: params.destination,
    Amount: {
      currency: params.currency,
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

export function buildDorriEscrowCreate(params: {
  account: string;
  destination: string;
  amount: string;
  issuer: string;
  currency: string;
  finishAfterRippleTime?: number;
  cancelAfterRippleTime: number;
}): EscrowCreate {
  return {
    TransactionType: 'EscrowCreate',
    Account: params.account,
    Destination: params.destination,
    Amount: {
      currency: params.currency,
      issuer: params.issuer,
      value: params.amount,
    },
    FinishAfter: params.finishAfterRippleTime,
    CancelAfter: params.cancelAfterRippleTime,
  };
}

export function buildXrpEscrowFinish(params: {
  account: string;
  owner: string;
  offerSequence: number;
  condition?: string;
  fulfillment?: string;
}): EscrowFinish {
  return {
    TransactionType: 'EscrowFinish',
    Account: params.account,
    Owner: params.owner,
    OfferSequence: params.offerSequence,
    Condition: params.condition,
    Fulfillment: params.fulfillment,
  };
}
