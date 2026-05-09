'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  BadgeDollarSign,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  LockKeyhole,
  MoreVertical,
  Wallet,
} from 'lucide-react'
import { useLang } from '@/components/LangContext'

const quickAmounts = [10, 20, 30, 50, 100]
const networkFeeUsd = 0.45
const currencies = {
  USD: { code: 'USD', rate: 1 },
  KRW: { code: 'KRW', rate: 1350 },
  JPY: { code: 'JPY', rate: 150 },
} as const

type Step = 'amount' | 'payment' | 'processing' | 'success'
type PaymentMethod = 'card' | 'wallet' | null
type CurrencyCode = keyof typeof currencies
type Currency = (typeof currencies)[CurrencyCode]

const copy = {
  KOR: {
    title: '충전하기',
    youPay: '결제 금액',
    youCharge: '충전 수량',
    live: '실시간',
    quickSelect: '빠른 선택',
    custom: '직접 입력',
    chargeAmount: '충전 금액',
    networkFee: '네트워크 수수료',
    totalCost: '총 결제 금액',
    exchange: '충전하기',
    paymentMethod: '결제 수단',
    paymentSubtitle: '결제 방법을 선택해 주세요',
    card: '신용/체크카드',
    cardDesc: '즉시 처리',
    digitalWallet: '디지털 지갑',
    digitalWalletDesc: 'Apple Pay, Google Pay',
    youPayLine: '결제 금액',
    youReceive: '충전 수량',
    exchangeRate: '환율',
    secure: 'Stripe를 통한 안전한 암호화 결제',
    proceed: '결제 진행하기',
    confirmTitle: '충전 내용을 확인해 주세요',
    confirmDesc: '결제 전 거래 정보를 다시 확인해 주세요.',
    charge: '충전',
    pay: '결제',
    walletPreview: '지갑 미리보기',
    currentBalance: '현재 잔액',
    newDeposit: '새 충전',
    newBalance: '충전 후 잔액',
    confirmPayment: '결제 확정',
    cancel: '취소',
    processing: '결제 처리 중',
    processingDesc: 'XRPL을 통해 DORRI로 변환 중입니다',
    pathfinding: '경로를 찾는 중...',
    pleaseWait: '잠시만 기다려 주세요...',
    securing: 'Ledger에서 최적 환율을 확인 중입니다',
    success: '충전 완료!',
    successDesc: 'DORRI가 성공적으로 충전되었습니다',
    settlementAmount: '정산 금액',
    settlementTime: '정산 시간',
    seconds: '3초',
    exploreMeetups: '밋업 둘러보기',
    goHome: '홈으로 가기',
  },
  ENG: {
    title: 'Add Funds',
    youPay: 'YOU PAY',
    youCharge: 'YOU CHARGE',
    live: 'Live',
    quickSelect: 'Quick Select',
    custom: 'Custom',
    chargeAmount: 'Charge Amount',
    networkFee: 'Network Fee',
    totalCost: 'Total Cost',
    exchange: 'Exchange',
    paymentMethod: 'Payment Method',
    paymentSubtitle: 'Select your preferred way to pay',
    card: 'Credit/Debit Card',
    cardDesc: 'Instant processing',
    digitalWallet: 'Digital Wallet',
    digitalWalletDesc: 'Apple Pay, Google Pay',
    youPayLine: 'You pay:',
    youReceive: 'You receive:',
    exchangeRate: 'Exchange rate',
    secure: 'Secure, encrypted payment processing via Stripe',
    proceed: 'Proceed to Pay',
    confirmTitle: 'Confirm Your Purchase',
    confirmDesc: 'Please review the transaction details before confirming your order.',
    charge: 'CHARGE',
    pay: 'PAY',
    walletPreview: 'Wallet Preview',
    currentBalance: 'Current Balance',
    newDeposit: 'New Deposit',
    newBalance: 'New Balance',
    confirmPayment: 'Confirm Payment',
    cancel: 'Cancel',
    processing: 'Processing Payment',
    processingDesc: 'Converting {currency} to DORRI via XRPL',
    pathfinding: 'Pathfinding...',
    pleaseWait: 'Please wait...',
    securing: 'Securing best rate on Ledger',
    success: 'Success!',
    successDesc: 'Funds Added Successfully',
    settlementAmount: 'SETTLEMENT AMOUNT',
    settlementTime: 'Settlement time',
    seconds: '3 seconds',
    exploreMeetups: 'Explore Meetups',
    goHome: 'Go to Home',
  },
}

type Copy = (typeof copy)['ENG']

export default function AddFundsPage() {
  const { lang } = useLang()
  const tx = copy[lang]
  const [dorriAmount, setDorriAmount] = useState(0)
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD')
  const [step, setStep] = useState<Step>('amount')
  const [showConfirm, setShowConfirm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)

  const currency = currencies[currencyCode]
  const payAmount = useMemo(() => dorriAmount * currency.rate, [currency.rate, dorriAmount])
  const networkFee = useMemo(() => (dorriAmount > 0 ? networkFeeUsd * currency.rate : 0), [currency.rate, dorriAmount])
  const total = useMemo(() => payAmount + networkFee, [networkFee, payAmount])

  useEffect(() => {
    if (step !== 'processing') {
      return
    }

    const timeout = window.setTimeout(() => setStep('success'), 2400)
    return () => window.clearTimeout(timeout)
  }, [step])

  if (step === 'processing') {
    return <ProcessingScreen currency={currency} tx={tx} />
  }

  if (step === 'success') {
    return <SuccessScreen currency={currency} total={total} dorriAmount={dorriAmount} tx={tx} />
  }

  return (
    <main className="min-h-screen bg-[#858585] md:bg-[#F6F3FF]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white md:max-w-7xl">
        <AddFundsHeader title={tx.title} />

        {step === 'amount' ? (
          <AmountStep
            dorriAmount={dorriAmount}
            currency={currency}
            currencyCode={currencyCode}
            payAmount={payAmount}
            networkFee={networkFee}
            total={total}
            onSelectAmount={setDorriAmount}
            onSelectCurrency={setCurrencyCode}
            onOpenConfirm={() => setShowConfirm(true)}
            tx={tx}
          />
        ) : (
          <PaymentStep
            dorriAmount={dorriAmount}
            currency={currency}
            networkFee={networkFee}
            total={total}
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
            onPay={() => setStep('processing')}
            tx={tx}
          />
        )}

        {showConfirm && (
          <ConfirmDialog
            dorriAmount={dorriAmount}
            currency={currency}
            total={total}
            onCancel={() => setShowConfirm(false)}
            tx={tx}
            onConfirm={() => {
              setShowConfirm(false)
              setStep('payment')
            }}
          />
        )}
      </div>
    </main>
  )
}

function AddFundsHeader({ title }: { title: string }) {
  return (
    <header className="flex h-[58px] items-center justify-between border-b border-[#EEEAF4] px-5 md:h-20 md:px-10">
      <Link href="/home" aria-label="Back to home" className="flex h-10 w-10 items-center justify-start text-[#33313A] md:h-12 md:w-12">
        <ArrowLeft className="h-[21px] w-[21px] md:h-7 md:w-7" />
      </Link>
      <h1 className="text-[15px] font-bold text-[#17171B] md:text-xl">{title}</h1>
      <button type="button" aria-label="More options" className="flex h-10 w-10 items-center justify-end text-[#33313A] md:h-12 md:w-12">
        <MoreVertical className="h-[19px] w-[19px] md:h-7 md:w-7" />
      </button>
    </header>
  )
}

function AmountStep({
  dorriAmount,
  currency,
  currencyCode,
  payAmount,
  networkFee,
  total,
  onSelectAmount,
  onSelectCurrency,
  onOpenConfirm,
  tx,
}: {
  dorriAmount: number
  currency: Currency
  currencyCode: CurrencyCode
  payAmount: number
  networkFee: number
  total: number
  onSelectAmount: (amount: number) => void
  onSelectCurrency: (currency: CurrencyCode) => void
  onOpenConfirm: () => void
  tx: Copy
}) {
  const disabled = dorriAmount <= 0

  return (
    <div className="mx-auto flex min-h-[calc(100vh-58px)] w-full max-w-[390px] flex-col px-5 pb-5 pt-14 md:min-h-[calc(100vh-80px)] md:max-w-7xl md:px-10 md:py-12">
      <div className="md:grid md:flex-1 md:grid-cols-[minmax(0,1fr)_520px] md:gap-10">
        <section className="md:rounded-[32px] md:bg-white md:p-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.09)]">
          <div className="relative md:mx-auto md:max-w-2xl">
            <CurrencyCard
              eyebrow={tx.youPay}
              value={formatMoney(payAmount, currency)}
              selector={<CurrencySelector selected={currencyCode} onSelect={onSelectCurrency} />}
            />

            <div className="relative z-10 mx-auto -my-3 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#6E3FD7] text-white shadow-lg md:-my-4 md:h-14 md:w-14">
              <ArrowLeftRight className="h-[18px] w-[18px] md:h-6 md:w-6" />
            </div>

            <CurrencyCard
              active={dorriAmount > 0}
              eyebrow={tx.youCharge}
              value={dorriAmount.toFixed(2)}
              valuePrefix={<BadgeDollarSign className="h-[21px] w-[21px] text-[#8060F6] md:h-7 md:w-7" />}
              selector={<DorriPill />}
            />
          </div>

          <div className="mx-auto mt-8 flex h-10 w-fit items-center gap-3 rounded-full border border-[#E7DFFF] px-5 text-[12px] text-[#7A7585] md:mt-10 md:h-12 md:px-7 md:text-sm">
            <span className="font-black text-[#6F3FD7]">XRPL</span>
            <span>
              1 DORRI = <span className="font-bold text-[#6F3FD7]">{formatMoney(currency.rate, currency)}</span>
            </span>
            <span className="text-[#C6C1CF]">&middot;</span>
            <span>{tx.live}</span>
          </div>
        </section>

        <section className="mt-6 md:mt-0 md:rounded-[32px] md:bg-white md:p-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.09)]">
          <h2 className="text-[14px] font-bold text-[#18161F] md:text-2xl">{tx.quickSelect}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-2">
            {quickAmounts.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => onSelectAmount(value)}
                onPointerDown={() => onSelectAmount(value)}
                onTouchEnd={(event) => {
                  event.preventDefault()
                  onSelectAmount(value)
                }}
                className={`h-12 rounded-lg border text-[13px] font-semibold transition-colors md:h-16 md:text-base ${
                  dorriAmount === value
                    ? 'border-[#8060F6] bg-[#8060F6] text-white'
                    : 'border-[#CFCBD6] bg-white text-[#5F5A68]'
                }`}
              >
                {value} DORRI
              </button>
            ))}
            <button type="button" className="h-12 rounded-lg border border-[#CFCBD6] bg-white text-[13px] font-semibold text-[#5F5A68] md:h-16 md:text-base">
              {tx.custom}
            </button>
          </div>

          <CostSummary currency={currency} amount={payAmount} fee={networkFee} total={total} tx={tx} />
        </section>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onOpenConfirm}
        onPointerDown={() => {
          if (!disabled) {
            onOpenConfirm()
          }
        }}
        onTouchEnd={(event) => {
          event.preventDefault()
          if (!disabled) {
            onOpenConfirm()
          }
        }}
        className={`mt-auto h-14 rounded-xl text-[14px] font-bold text-white md:mx-auto md:mt-10 md:h-16 md:w-[520px] md:text-base ${
          disabled ? 'cursor-not-allowed bg-[#B7B7B7]' : 'bg-[#673BD2]'
        }`}
      >
        {tx.exchange}
      </button>
    </div>
  )
}

function PaymentStep({
  dorriAmount,
  currency,
  networkFee,
  total,
  paymentMethod,
  onSelectPaymentMethod,
  onPay,
  tx,
}: {
  dorriAmount: number
  currency: Currency
  networkFee: number
  total: number
  paymentMethod: PaymentMethod
  onSelectPaymentMethod: (method: PaymentMethod) => void
  onPay: () => void
  tx: Copy
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-58px)] w-full max-w-[390px] flex-col px-5 pb-5 pt-6 md:min-h-[calc(100vh-80px)] md:max-w-4xl md:px-10 md:py-12">
      <div className="md:rounded-[32px] md:bg-white md:p-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.09)]">
        <h2 className="text-[22px] font-black text-[#18161F] md:text-4xl">{tx.paymentMethod}</h2>
        <p className="mt-1 text-[13px] text-[#5F5A68] md:mt-3 md:text-base">{tx.paymentSubtitle}</p>

        <div className="mt-5 space-y-3 md:mt-8 md:space-y-5">
          <PaymentMethodCard
            selected={paymentMethod === 'card'}
            icon={<CreditCard className="h-[22px] w-[22px] md:h-7 md:w-7" />}
            title={tx.card}
            description={tx.cardDesc}
            onClick={() => onSelectPaymentMethod('card')}
          />
          <PaymentMethodCard
            selected={paymentMethod === 'wallet'}
            icon={<Wallet className="h-[22px] w-[22px] md:h-7 md:w-7" />}
            title={tx.digitalWallet}
            description={tx.digitalWalletDesc}
            onClick={() => onSelectPaymentMethod('wallet')}
          />
        </div>

        {paymentMethod && (
          <div className="mt-5 rounded-lg bg-[#673BD2] p-5 text-white shadow-[0_12px_24px_rgba(103,59,210,0.2)] md:mt-8 md:rounded-2xl md:p-7">
            <div className="flex items-end justify-between border-b border-white/20 pb-4 md:pb-5">
              <span className="text-[12px] text-white/70 md:text-sm">{tx.youPayLine}</span>
              <div className="text-right">
                <p className="text-[17px] font-black md:text-2xl">{formatMoney(total, currency)}</p>
                <p className="text-[10px] text-white/70 md:text-xs">{tx.networkFee} {formatMoney(networkFee, currency)}</p>
              </div>
            </div>
            <div className="flex items-end justify-between pt-4 md:pt-5">
              <span className="text-[12px] text-white/70 md:text-sm">{tx.youReceive}</span>
              <div className="text-right">
                <p className="text-[17px] font-black md:text-2xl">{dorriAmount} DORRI</p>
                <p className="text-[10px] text-white/70 md:text-xs">
                  {tx.exchangeRate}: 1 DORRI = {formatMoney(currency.rate, currency)}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 flex items-center gap-2 text-[11px] text-[#8A8592] md:mt-6 md:text-sm">
          <LockKeyhole className="h-[13px] w-[13px] md:h-4 md:w-4" />
          {tx.secure}
        </p>
      </div>

      <button
        disabled={!paymentMethod}
        onClick={onPay}
        className={`mt-auto h-14 rounded-xl text-[14px] font-bold text-white md:mx-auto md:mt-10 md:h-16 md:w-[520px] md:text-base ${
          paymentMethod ? 'bg-[#673BD2]' : 'cursor-not-allowed bg-[#B7B7B7]'
        }`}
      >
        {tx.proceed}
      </button>
    </div>
  )
}

function CurrencyCard({
  eyebrow,
  value,
  selector,
  active = false,
  valuePrefix,
}: {
  eyebrow: string
  value: string
  selector: ReactNode
  active?: boolean
  valuePrefix?: ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border px-5 py-6 shadow-[0_12px_24px_rgba(86,58,150,0.08)] md:px-8 md:py-8 ${
        active ? 'border-[#E6DAFF] bg-[#F1ECFF]' : 'border-[#E6DAFF] bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-semibold md:text-xs ${active ? 'text-[#6F3FD7]' : 'text-[#6F6876]'}`}>{eyebrow}</p>
          <div className="mt-4 flex items-center gap-1 text-[26px] font-black leading-none text-[#24212C] md:mt-5 md:text-4xl">
            {valuePrefix}
            <span className={active ? 'text-[#6F3FD7]' : ''}>{value}</span>
          </div>
        </div>
        {selector}
      </div>
    </div>
  )
}

function CurrencySelector({
  selected,
  onSelect,
}: {
  selected: CurrencyCode
  onSelect: (currency: CurrencyCode) => void
}) {
  return (
    <div className="flex rounded-full border border-[#D8D2E3] bg-white p-1 md:p-1.5">
      {(Object.keys(currencies) as CurrencyCode[]).map((code) => (
        <button
          type="button"
          key={code}
          onClick={() => onSelect(code)}
          onPointerDown={() => onSelect(code)}
          onTouchEnd={(event) => {
            event.preventDefault()
            onSelect(code)
          }}
          className={`h-7 rounded-full px-2 text-[11px] font-black transition-colors md:h-9 md:px-4 md:text-sm ${
            selected === code ? 'bg-[#8060F6] text-white' : 'text-[#5F5A68]'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}

function DorriPill() {
  return (
    <div className="flex h-9 items-center gap-2 rounded-full border border-[#CFCBD6] bg-white px-3 text-[12px] font-bold text-[#6F3FD7] md:h-11 md:px-5 md:text-sm">
      <BadgeDollarSign className="h-[18px] w-[18px] text-[#8060F6] md:h-6 md:w-6" />
      DORRI
    </div>
  )
}

function CostSummary({ currency, amount, fee, total, tx }: { currency: Currency; amount: number; fee: number; total: number; tx: Copy }) {
  return (
    <div className="mt-5 rounded-lg bg-[#F1ECFF] p-4 text-[12px] md:mt-7 md:rounded-2xl md:p-6 md:text-sm">
      <SummaryLine label={tx.chargeAmount} value={formatMoney(amount, currency)} />
      <SummaryLine label={tx.networkFee} value={formatMoney(fee, currency)} />
      <div className="mt-4 flex items-center justify-between text-[13px] font-black md:text-base">
        <span>{tx.totalCost}</span>
        <span className="text-[#6F3FD7]">{formatMoney(total, currency)}</span>
      </div>
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex items-center justify-between text-[#6B6574]">
      <span>{label}</span>
      <span className="font-black text-[#18161F]">{value}</span>
    </div>
  )
}

function PaymentMethodCard({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onClick}
      onTouchEnd={(event) => {
        event.preventDefault()
        onClick()
      }}
      className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left md:rounded-2xl md:p-6 ${
        selected ? 'border-[#6F3FD7] bg-white' : 'border-[#DAD6E2] bg-white'
      }`}
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-lg md:h-16 md:w-16 md:rounded-xl ${
          selected ? 'bg-[#8060F6] text-white' : 'bg-[#F0EEF4] text-[#55505C]'
        }`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-[14px] font-black text-[#18161F] md:text-lg">{title}</span>
        <span className="mt-1 block text-[11px] text-[#6F6A76] md:text-sm">{description}</span>
      </span>
      {selected && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6F3FD7] text-white md:h-8 md:w-8">
          <Check className="h-[15px] w-[15px] md:h-5 md:w-5" />
        </span>
      )}
    </button>
  )
}

function ConfirmDialog({
  dorriAmount,
  currency,
  total,
  onCancel,
  onConfirm,
  tx,
}: {
  dorriAmount: number
  currency: Currency
  total: number
  onCancel: () => void
  onConfirm: () => void
  tx: Copy
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-5">
      <div className="w-full max-w-[350px] rounded-2xl bg-white p-5 shadow-2xl md:max-w-[560px] md:rounded-[28px] md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF6C7] text-[#D8A300] md:h-20 md:w-20">
          <AlertTriangle className="h-6 w-6 md:h-9 md:w-9" />
        </div>
        <h2 className="mt-5 text-center text-[22px] font-black text-[#18161F] md:mt-7 md:text-3xl">{tx.confirmTitle}</h2>
        <p className="mx-auto mt-2 max-w-[260px] text-center text-[12px] leading-relaxed text-[#6B6574] md:mt-3 md:max-w-sm md:text-sm">
          {tx.confirmDesc}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 md:mt-7 md:gap-4">
          <ConfirmBox label={tx.charge} value={`${dorriAmount} DORRI`} />
          <ConfirmBox label={tx.pay} value={formatMoney(total, currency)} />
        </div>

        <div className="mt-4 rounded-lg bg-[#F1ECFF] px-4 py-3 text-right text-[11px] text-[#6B6574] md:rounded-xl md:px-5 md:py-4 md:text-sm">
          1 DORRI = {formatMoney(currency.rate, currency)}
        </div>

        <div className="mt-4 rounded-lg border border-[#E7E2ED] p-4 md:rounded-xl md:p-6">
          <h3 className="flex items-center gap-2 text-[14px] font-black text-[#18161F] md:text-lg">
            <Wallet className="h-4 w-4 text-[#6F3FD7] md:h-5 md:w-5" />
            {tx.walletPreview}
          </h3>
          <div className="mt-4 space-y-3 text-[13px] md:space-y-4 md:text-base">
            <PreviewLine label={tx.currentBalance} value="0 DORRI" />
            <PreviewLine label={tx.newDeposit} value={`+${dorriAmount} DORRI`} positive />
            <PreviewLine label={tx.newBalance} value={`${dorriAmount} DORRI`} strong />
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          onPointerDown={onConfirm}
          onTouchEnd={(event) => {
            event.preventDefault()
            onConfirm()
          }}
          className="mt-5 h-12 w-full rounded-lg bg-[#673BD2] text-[14px] font-bold text-white md:h-14 md:rounded-xl md:text-base"
        >
          {tx.confirmPayment}
        </button>
        <button
          type="button"
          onClick={onCancel}
          onPointerDown={onCancel}
          onTouchEnd={(event) => {
            event.preventDefault()
            onCancel()
          }}
          className="mt-3 h-12 w-full rounded-lg border border-[#E2DDE8] text-[14px] font-semibold text-[#5F5A68] md:h-14 md:rounded-xl md:text-base"
        >
          {tx.cancel}
        </button>
      </div>
    </div>
  )
}

function ConfirmBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#8060F6] p-4 md:rounded-xl md:p-5">
      <p className="text-[10px] font-semibold text-[#7A7484] md:text-xs">{label}</p>
      <p className="mt-2 text-[15px] font-black text-[#6F3FD7] md:text-xl">{value}</p>
    </div>
  )
}

function PreviewLine({
  label,
  value,
  positive = false,
  strong = false,
}: {
  label: string
  value: string
  positive?: boolean
  strong?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'border-t border-[#ECE7F2] pt-3 font-black' : ''}`}>
      <span className="text-[#6B6574]">{label}</span>
      <span className={positive ? 'font-bold text-[#11995A]' : strong ? 'text-[#6F3FD7]' : 'font-bold text-[#18161F]'}>
        {value}
      </span>
    </div>
  )
}

function ProcessingScreen({ currency, tx }: { currency: Currency; tx: Copy }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-[22px] font-black text-[#18161F] md:text-4xl">{tx.processing}</h1>
      <p className="mt-2 text-[13px] leading-relaxed text-[#8A8592] md:mt-4 md:text-base">
        {tx.processingDesc.replace('{currency}', currency.code)}
        <br />
        {tx.pathfinding}
      </p>
      <div className="mt-16 h-28 w-28 animate-spin rounded-full border-[7px] border-[#E8E0FF] border-t-[#8060F6] md:h-36 md:w-36 md:border-[9px]" />
      <p className="mt-16 text-[13px] text-[#8A8592] md:text-base">{tx.pleaseWait}</p>
      <p className="mt-3 text-[11px] text-[#C2BEC8] md:text-sm">{tx.securing}</p>
    </main>
  )
}

function SuccessScreen({ currency, total, dorriAmount, tx }: { currency: Currency; total: number; dorriAmount: number; tx: Copy }) {
  return (
    <main className="min-h-screen bg-[#858585] md:bg-[#F6F3FF]">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center bg-white px-8 pt-40 text-center md:max-w-7xl md:justify-center md:px-8 md:pt-0">
        <div className="w-full md:max-w-4xl md:rounded-[36px] md:bg-white md:p-16 md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAFBF0] md:h-28 md:w-28">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#62B763] text-white md:h-16 md:w-16">
              <CheckCircle2 className="h-7 w-7 md:h-9 md:w-9" />
            </span>
          </div>
          <h1 className="mt-6 text-[22px] font-black text-[#18161F] md:mt-8 md:text-4xl">{tx.success}</h1>
          <p className="mt-2 text-[14px] text-[#5F5A68] md:mt-3 md:text-lg">{tx.successDesc}</p>

          <div className="mt-10 w-full rounded-lg border border-[#E8E3EF] bg-white p-4 text-left shadow-[0_8px_20px_rgba(31,25,45,0.06)] md:mx-auto md:max-w-2xl md:rounded-xl md:p-8">
            <p className="text-[10px] font-bold text-[#8A8592] md:text-xs">{tx.settlementAmount}</p>
            <p className="mt-1 text-[18px] font-black text-[#18161F] md:text-3xl">
              {formatMoney(total, currency)} <span className="text-[#6F3FD7]">-&gt; DORRI {dorriAmount.toFixed(2)}</span>
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-[#ECE7F2] pt-4 text-[13px] text-[#5F5A68] md:mt-6 md:pt-6 md:text-base">
              <span className="flex items-center gap-2">
                <Clock3 className="h-[15px] w-[15px] md:h-5 md:w-5" />
                {tx.settlementTime}
              </span>
              <span className="font-bold text-[#18161F]">{tx.seconds}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:mx-auto md:max-w-2xl md:grid-cols-2">
            <Link href="/meetups" className="flex w-full items-center justify-center rounded-lg bg-[#673BD2] py-4 text-[14px] font-bold text-white md:h-16 md:text-base">
              {tx.exploreMeetups}
            </Link>
            <Link href="/home" className="flex w-full items-center justify-center rounded-lg border border-[#E0DCE7] py-4 text-[14px] font-semibold text-[#5F5A68] md:h-16 md:text-base">
              {tx.goHome}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function formatMoney(value: number, currency: Currency) {
  if (currency.code === 'USD') {
    return `USD ${value.toFixed(2)}`
  }

  return `${currency.code} ${Math.round(value).toLocaleString('en-US')}`
}
