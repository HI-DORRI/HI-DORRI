'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowLeftRight, BadgeDollarSign, CheckCircle2, CreditCard, MoreVertical, Wallet } from 'lucide-react'
import { useLang } from '@/components/LangContext'
import { chargeDorri, createChargeQuote, getDorriRates, refreshDorriBalance } from '@/lib/domain'

const quickAmounts = [10, 20, 30, 50, 100]
const networkFeeUsd = 0.45
const defaults: Record<'USD' | 'KRW' | 'JPY', { code: 'USD' | 'KRW' | 'JPY'; rate: number }> = {
  USD: { code: 'USD', rate: 1 },
  KRW: { code: 'KRW', rate: 1350 },
  JPY: { code: 'JPY', rate: 150 },
} as const

type CurrencyCode = keyof typeof defaults
type Currency = (typeof defaults)[CurrencyCode]
type Step = 'amount' | 'payment' | 'processing' | 'success'
type PaymentMethod = 'card' | 'wallet' | null

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
    secure: 'Stripe를 통한 안전한 암호화 결제',
    proceed: '결제 진행하기',
    confirmTitle: '충전 내용을 확인해 주세요',
    confirmDesc: '결제 전 거래 정보를 다시 확인해 주세요.',
    confirmPayment: '결제 확정',
    cancel: '취소',
    processing: '결제 처리 중',
    processingDesc: 'XRPL을 통해 DORRI로 변환 중입니다',
    success: '충전 완료!',
    successDesc: 'DORRI가 성공적으로 충전되었습니다.',
    settlementAmount: '정산 금액',
    exploreMeetups: '밋업 둘러보기',
    goHome: '홈으로 가기',
    noMethod: '결제 수단을 선택해 주세요.',
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
    secure: 'Secure, encrypted payment processing via Stripe',
    proceed: 'Proceed to Pay',
    confirmTitle: 'Confirm Your Purchase',
    confirmDesc: 'Please review the transaction details before confirming your order.',
    confirmPayment: 'Confirm Payment',
    cancel: 'Cancel',
    processing: 'Processing Payment',
    processingDesc: 'Converting to DORRI via XRPL',
    success: 'Success!',
    successDesc: 'Funds Added Successfully',
    settlementAmount: 'SETTLEMENT AMOUNT',
    exploreMeetups: 'Explore Meetups',
    goHome: 'Go to Home',
    noMethod: 'Select a payment method.',
  },
}

export default function AddFundsPage() {
  const { lang } = useLang()
  const tx = copy[lang]
  const [dorriAmount, setDorriAmount] = useState(0)
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD')
  const [rates, setRates] = useState(defaults)
  const [step, setStep] = useState<Step>('amount')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [chargedTotal, setChargedTotal] = useState(0)

  const currency = rates[currencyCode]
  const payAmount = useMemo(() => dorriAmount * currency.rate, [currency.rate, dorriAmount])
  const networkFee = useMemo(() => (dorriAmount > 0 ? networkFeeUsd * currency.rate : 0), [currency.rate, dorriAmount])
  const total = useMemo(() => payAmount + networkFee, [networkFee, payAmount])

  useEffect(() => {
    getDorriRates().then((result) => {
      const next = { ...defaults }
      result.rates.forEach((rate) => {
        if (rate.currency in next) {
          next[rate.currency as CurrencyCode] = { code: rate.currency as CurrencyCode, rate: Number(rate.fiatPerDorri) }
        }
      })
      setRates(next)
    }).catch(() => undefined)
  }, [])

  async function handlePay() {
    if (!paymentMethod) {
      setError(tx.noMethod)
      return
    }

    setError('')
    setStep('processing')

    try {
      const quote = await createChargeQuote({
        fiatCurrency: currency.code,
        fiatAmount: payAmount.toFixed(currency.code === 'USD' ? 2 : 0),
      })
      await chargeDorri(quote.quoteId)
      await refreshDorriBalance(3, 1000)
      setChargedTotal(total)
      setStep('success')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Charge failed')
      setStep('payment')
    }
  }

  if (step === 'processing') {
    return <ProcessingScreen tx={tx} />
  }

  if (step === 'success') {
    return <SuccessScreen tx={tx} currency={currency} total={chargedTotal || total} dorriAmount={dorriAmount} />
  }

  return (
    <main className="min-h-screen bg-[#858585] md:bg-[#F6F3FF]">
      <div className="mx-auto min-h-screen w-full max-w-[390px] bg-white md:max-w-7xl">
        <Header title={tx.title} />
        {step === 'amount' ? (
          <AmountStep
            tx={tx}
            dorriAmount={dorriAmount}
            currency={currency}
            currencyCode={currencyCode}
            payAmount={payAmount}
            networkFee={networkFee}
            total={total}
            onSelectAmount={setDorriAmount}
            onSelectCurrency={setCurrencyCode}
            onOpenConfirm={() => setShowConfirm(true)}
          />
        ) : (
          <PaymentStep
            tx={tx}
            dorriAmount={dorriAmount}
            currency={currency}
            networkFee={networkFee}
            total={total}
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
            onPay={handlePay}
            error={error}
          />
        )}
        {showConfirm && (
          <ConfirmDialog
            tx={tx}
            dorriAmount={dorriAmount}
            currency={currency}
            total={total}
            onCancel={() => setShowConfirm(false)}
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

function Header({ title }: { title: string }) {
  return (
    <header className="flex h-[58px] items-center justify-between border-b border-[#EEEAF4] px-5 md:h-20 md:px-10">
      <Link href="/home" className="flex h-10 w-10 items-center justify-start text-[#33313A]"><ArrowLeft size={22} /></Link>
      <h1 className="text-[15px] font-bold text-[#17171B] md:text-xl">{title}</h1>
      <button className="flex h-10 w-10 items-center justify-end text-[#33313A]"><MoreVertical size={20} /></button>
    </header>
  )
}

function AmountStep(props: {
  tx: (typeof copy)['KOR']
  dorriAmount: number
  currency: Currency
  currencyCode: CurrencyCode
  payAmount: number
  networkFee: number
  total: number
  onSelectAmount: (amount: number) => void
  onSelectCurrency: (currency: CurrencyCode) => void
  onOpenConfirm: () => void
}) {
  const disabled = props.dorriAmount <= 0

  return (
    <div className="mx-auto flex min-h-[calc(100vh-58px)] w-full max-w-[390px] flex-col px-5 pb-5 pt-14 md:min-h-[calc(100vh-80px)] md:max-w-7xl md:px-10 md:py-12">
      <div className="md:grid md:flex-1 md:grid-cols-[minmax(0,1fr)_520px] md:gap-10">
        <section className="md:rounded-[32px] md:bg-white md:p-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.09)]">
          <CurrencyCard label={props.tx.youPay} value={formatMoney(props.payAmount, props.currency)}>
            <CurrencySelector selected={props.currencyCode} onSelect={props.onSelectCurrency} />
          </CurrencyCard>
          <div className="relative z-10 mx-auto -my-3 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#6E3FD7] text-white shadow-lg md:h-14 md:w-14">
            <ArrowLeftRight size={20} />
          </div>
          <CurrencyCard active label={props.tx.youCharge} value={props.dorriAmount.toFixed(2)} prefix={<BadgeDollarSign className="h-6 w-6 text-[#8060F6]" />}>
            <div className="rounded-full border border-[#CFCBD6] bg-white px-4 py-2 text-[12px] font-bold text-[#6F3FD7]">DORRI</div>
          </CurrencyCard>
          <div className="mx-auto mt-8 flex h-10 w-fit items-center gap-3 rounded-full border border-[#E7DFFF] px-5 text-[12px] text-[#7A7585] md:h-12 md:text-sm">
            <b className="text-[#6F3FD7]">XRPL</b>
            <span>1 DORRI = <b className="text-[#6F3FD7]">{formatMoney(props.currency.rate, props.currency)}</b></span>
            <span>{props.tx.live}</span>
          </div>
        </section>
        <section className="mt-6 md:mt-0 md:rounded-[32px] md:bg-white md:p-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.09)]">
          <h2 className="text-[14px] font-bold text-[#18161F] md:text-2xl">{props.tx.quickSelect}</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 md:grid-cols-2">
            {quickAmounts.map((value) => (
              <button key={value} onClick={() => props.onSelectAmount(value)} className={`h-12 rounded-lg border text-[13px] font-semibold md:h-16 md:text-base ${props.dorriAmount === value ? 'border-[#8060F6] bg-[#8060F6] text-white' : 'border-[#CFCBD6] bg-white text-[#5F5A68]'}`}>
                {value} DORRI
              </button>
            ))}
            <button className="h-12 rounded-lg border border-[#CFCBD6] bg-white text-[13px] font-semibold text-[#5F5A68] md:h-16 md:text-base">{props.tx.custom}</button>
          </div>
          <CostSummary tx={props.tx} currency={props.currency} amount={props.payAmount} fee={props.networkFee} total={props.total} />
        </section>
      </div>
      <button disabled={disabled} onClick={props.onOpenConfirm} className={`mt-auto h-14 rounded-xl text-[14px] font-bold text-white md:mx-auto md:mt-10 md:h-16 md:w-[520px] md:text-base ${disabled ? 'bg-[#B7B7B7]' : 'bg-[#673BD2]'}`}>
        {props.tx.exchange}
      </button>
    </div>
  )
}

function PaymentStep(props: {
  tx: (typeof copy)['KOR']
  dorriAmount: number
  currency: Currency
  networkFee: number
  total: number
  paymentMethod: PaymentMethod
  onSelectPaymentMethod: (method: PaymentMethod) => void
  onPay: () => void
  error: string
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-58px)] w-full max-w-[390px] flex-col px-5 pb-5 pt-6 md:min-h-[calc(100vh-80px)] md:max-w-4xl md:px-10 md:py-12">
      <div className="md:rounded-[32px] md:bg-white md:p-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.09)]">
        <h2 className="text-[22px] font-black text-[#18161F] md:text-4xl">{props.tx.paymentMethod}</h2>
        <p className="mt-1 text-[13px] text-[#5F5A68] md:text-base">{props.tx.paymentSubtitle}</p>
        <div className="mt-5 space-y-3 md:mt-8">
          <Method selected={props.paymentMethod === 'card'} onClick={() => props.onSelectPaymentMethod('card')} icon={<CreditCard />} title={props.tx.card} desc={props.tx.cardDesc} />
          <Method selected={props.paymentMethod === 'wallet'} onClick={() => props.onSelectPaymentMethod('wallet')} icon={<Wallet />} title={props.tx.digitalWallet} desc={props.tx.digitalWalletDesc} />
        </div>
        {props.paymentMethod && (
          <div className="mt-5 rounded-lg bg-[#673BD2] p-5 text-white md:p-7">
            <div className="flex justify-between border-b border-white/20 pb-4"><span>{props.tx.totalCost}</span><b>{formatMoney(props.total, props.currency)}</b></div>
            <div className="flex justify-between pt-4"><span>DORRI</span><b>{props.dorriAmount.toFixed(2)}</b></div>
          </div>
        )}
        <p className="mt-4 text-[11px] text-[#8A8592] md:text-sm">{props.tx.secure}</p>
        {props.error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-500">{props.error}</p>}
      </div>
      <button disabled={!props.paymentMethod} onClick={props.onPay} className={`mt-auto h-14 rounded-xl text-[14px] font-bold text-white md:mx-auto md:mt-10 md:h-16 md:w-[520px] ${props.paymentMethod ? 'bg-[#673BD2]' : 'bg-[#B7B7B7]'}`}>
        {props.tx.proceed}
      </button>
    </div>
  )
}

function CurrencyCard({ label, value, prefix, active, children }: { label: string; value: string; prefix?: ReactNode; active?: boolean; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border px-5 py-6 shadow-[0_12px_24px_rgba(86,58,150,0.08)] md:px-8 md:py-8 ${active ? 'border-[#E6DAFF] bg-[#F1ECFF]' : 'border-[#E6DAFF] bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-semibold text-[#6F6876] md:text-xs">{label}</p><div className="mt-4 flex items-center gap-1 text-[26px] font-black md:text-4xl">{prefix}<span className={active ? 'text-[#6F3FD7]' : ''}>{value}</span></div></div>
        {children}
      </div>
    </div>
  )
}

function CurrencySelector({ selected, onSelect }: { selected: CurrencyCode; onSelect: (currency: CurrencyCode) => void }) {
  return (
    <div className="flex rounded-full border border-[#D8D2E3] bg-white p-1">
      {(Object.keys(defaults) as CurrencyCode[]).map((code) => (
        <button key={code} onClick={() => onSelect(code)} className={`h-7 rounded-full px-2 text-[11px] font-black md:h-9 md:px-4 ${selected === code ? 'bg-[#8060F6] text-white' : 'text-[#5F5A68]'}`}>{code}</button>
      ))}
    </div>
  )
}

function CostSummary({ tx, currency, amount, fee, total }: { tx: (typeof copy)['KOR']; currency: Currency; amount: number; fee: number; total: number }) {
  return (
    <div className="mt-5 rounded-lg bg-[#F1ECFF] p-4 text-[12px] md:p-6 md:text-sm">
      <Line label={tx.chargeAmount} value={formatMoney(amount, currency)} />
      <Line label={tx.networkFee} value={formatMoney(fee, currency)} />
      <div className="mt-4 flex justify-between text-[13px] font-black md:text-base"><span>{tx.totalCost}</span><span className="text-[#6F3FD7]">{formatMoney(total, currency)}</span></div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="mb-3 flex justify-between text-[#6B6574]"><span>{label}</span><b className="text-[#18161F]">{value}</b></div>
}

function Method({ selected, onClick, icon, title, desc }: { selected: boolean; onClick: () => void; icon: ReactNode; title: string; desc: string }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left md:p-6 ${selected ? 'border-[#6F3FD7]' : 'border-[#DAD6E2]'}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${selected ? 'bg-[#8060F6] text-white' : 'bg-[#F0EEF4] text-[#55505C]'}`}>{icon}</span>
      <span><b className="block text-[14px] text-[#18161F] md:text-lg">{title}</b><span className="text-[11px] text-[#6F6A76] md:text-sm">{desc}</span></span>
    </button>
  )
}

function ConfirmDialog({ tx, dorriAmount, currency, total, onCancel, onConfirm }: { tx: (typeof copy)['KOR']; dorriAmount: number; currency: Currency; total: number; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-5">
      <div className="w-full max-w-[350px] rounded-2xl bg-white p-5 shadow-2xl md:max-w-[560px] md:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF6C7] text-[#D8A300]"><AlertTriangle /></div>
        <h2 className="mt-5 text-center text-[22px] font-black md:text-3xl">{tx.confirmTitle}</h2>
        <p className="mt-2 text-center text-[12px] text-[#6B6574] md:text-sm">{tx.confirmDesc}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#8060F6] p-4"><p className="text-[10px] text-[#7A7484]">DORRI</p><b className="mt-2 block text-[#6F3FD7]">{dorriAmount.toFixed(2)}</b></div>
          <div className="rounded-lg border border-[#8060F6] p-4"><p className="text-[10px] text-[#7A7484]">{tx.totalCost}</p><b className="mt-2 block text-[#6F3FD7]">{formatMoney(total, currency)}</b></div>
        </div>
        <button onClick={onConfirm} className="mt-5 h-12 w-full rounded-lg bg-[#673BD2] text-[14px] font-bold text-white">{tx.confirmPayment}</button>
        <button onClick={onCancel} className="mt-3 h-12 w-full rounded-lg border border-[#E2DDE8] text-[14px] font-semibold text-[#5F5A68]">{tx.cancel}</button>
      </div>
    </div>
  )
}

function ProcessingScreen({ tx }: { tx: (typeof copy)['KOR'] }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <h1 className="text-[22px] font-black md:text-4xl">{tx.processing}</h1>
      <p className="mt-2 text-[13px] text-[#8A8592] md:text-base">{tx.processingDesc}</p>
      <div className="mt-16 h-28 w-28 animate-spin rounded-full border-[7px] border-[#E8E0FF] border-t-[#8060F6] md:h-36 md:w-36" />
    </main>
  )
}

function SuccessScreen({ tx, currency, total, dorriAmount }: { tx: (typeof copy)['KOR']; currency: Currency; total: number; dorriAmount: number }) {
  return (
    <main className="min-h-screen bg-[#858585] md:bg-[#F6F3FF]">
      <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center bg-white px-8 pt-40 text-center md:max-w-7xl md:justify-center md:pt-0">
        <div className="w-full md:max-w-4xl md:rounded-[36px] md:bg-white md:p-16 md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EAFBF0]"><CheckCircle2 className="h-11 w-11 text-[#62B763]" /></div>
          <h1 className="mt-6 text-[22px] font-black md:text-4xl">{tx.success}</h1>
          <p className="mt-2 text-[14px] text-[#5F5A68] md:text-lg">{tx.successDesc}</p>
          <div className="mt-10 rounded-lg border border-[#E8E3EF] bg-white p-4 text-left md:mx-auto md:max-w-2xl md:p-8">
            <p className="text-[10px] font-bold text-[#8A8592]">{tx.settlementAmount}</p>
            <p className="mt-1 text-[18px] font-black md:text-3xl">{formatMoney(total, currency)} <span className="text-[#6F3FD7]">-&gt; DORRI {dorriAmount.toFixed(2)}</span></p>
          </div>
          <div className="mt-8 grid gap-4 md:mx-auto md:max-w-2xl md:grid-cols-2">
            <Link href="/meetups" className="flex justify-center rounded-lg bg-[#673BD2] py-4 text-[14px] font-bold text-white">{tx.exploreMeetups}</Link>
            <Link href="/home" className="flex justify-center rounded-lg border border-[#E0DCE7] py-4 text-[14px] font-semibold text-[#5F5A68]">{tx.goHome}</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

function formatMoney(value: number, currency: Currency) {
  if (currency.code === 'USD') return `USD ${value.toFixed(2)}`
  return `${currency.code} ${Math.round(value).toLocaleString('en-US')}`
}
