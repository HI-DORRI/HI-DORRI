'use client'
import { useEffect, useState } from 'react'
import { Plus, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, ChevronRight, Copy } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'
import { getLedgerTxs, getWalletSummary, type LedgerTx } from '@/lib/domain'

const t = {
  KOR: {
    balance: '내 지갑 잔액',
    charge: '충전하기',
    send: '송금하기',
    address: '내 지갑 주소',
    copy: '복사',
    history: '거래 내역',
    tabs: ['전체', '충전', '송금', '정산'],
    more: '더보기',
    types: { charge: '충전', send: '송금', settle: '정산' },
    unit: 'DORRI',
  },
  ENG: {
    balance: 'My Wallet Balance',
    charge: 'Add Funds',
    send: 'Send',
    address: 'My Wallet Address',
    copy: 'Copy',
    history: 'Transaction History',
    tabs: ['All', 'Deposit', 'Send', 'Settlement'],
    more: 'Load More',
    types: { charge: 'Deposit', send: 'Send', settle: 'Settlement' },
    unit: 'DORRI',
  }
}

const typeMeta = {
  WALLET_FUND: { icon: ArrowDownLeft, kind: 'charge', KOR: '지갑 생성/충전', ENG: 'Wallet funding' },
  TRUST_SET: { icon: ArrowUpRight, kind: 'settle', KOR: 'DORRI 신뢰선 설정', ENG: 'DORRI trustline' },
  DORRI_PAYMENT: { icon: ArrowDownLeft, kind: 'charge', KOR: 'DORRI 충전', ENG: 'DORRI charge' },
  ESCROW_CREATE: { icon: ArrowUpRight, kind: 'send', KOR: '밋업 참가비/보증금 잠금', ENG: 'Meetup fee/deposit locked' },
  ESCROW_FINISH: { icon: ArrowDownLeft, kind: 'settle', KOR: '밋업 정산 완료', ENG: 'Meetup settlement completed' },
  ESCROW_CANCEL: { icon: ArrowDownLeft, kind: 'settle', KOR: '밋업 신청 취소/환불', ENG: 'Meetup canceled/refunded' },
  SETTLEMENT_PAYMENT: { icon: ArrowDownLeft, kind: 'settle', KOR: '밋업 정산 지급 처리', ENG: 'Meetup settlement payout' },
} as const

export default function WalletPage() {
  const { lang } = useLang()
  const tx = t[lang]
  const [activeTab, setActiveTab] = useState(tx.tabs[0])
  const [wallet, setWallet] = useState<{ xrplAddress: string } | null>(null)
  const [dorriBalance, setDorriBalance] = useState('0')
  const [ledgerTxs, setLedgerTxs] = useState<LedgerTx[]>([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getWalletSummary()
      .then(({ wallet, dorri }) => {
        setWallet(wallet)
        setDorriBalance(dorri?.balance ?? '0')
      })
      .catch(() => undefined)
    getLedgerTxs().then(setLedgerTxs).catch(() => setLedgerTxs([]))
  }, [])

  const rows = ledgerTxs.map((item) => {
    const meta = typeMeta[item.txType as keyof typeof typeMeta] ?? { icon: ArrowUpRight, kind: 'settle', KOR: item.txType, ENG: item.txType }
    return {
      ...item,
      type: meta.kind,
      desc: meta[lang],
      icon: meta.icon,
      date: new Date(item.validatedAt ?? item.createdAt).toLocaleDateString(lang === 'KOR' ? 'ko-KR' : 'en-US'),
    }
  })

  const filtered = activeTab === tx.tabs[0]
    ? rows
    : rows.filter(item =>
        activeTab === tx.tabs[1] ? item.type === 'charge'
        : activeTab === tx.tabs[2] ? item.type === 'send'
        : item.type === 'settle'
      )

  async function copyAddress() {
    if (!wallet?.xrplAddress) return
    await navigator.clipboard.writeText(wallet.xrplAddress)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-24 md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      <div className="md:mx-auto md:grid md:max-w-6xl md:grid-cols-[minmax(0,1fr)_520px] md:gap-8">
        <section>
      <div className="relative overflow-hidden px-5 pt-2 pb-8 md:rounded-[32px] md:px-10 md:py-10 md:shadow-[0_18px_48px_rgba(44,35,77,0.12)]"
        style={{ background: 'linear-gradient(160deg, #7446D8, #5B21B6)' }}>
        <div className="absolute right-[-28px] top-5 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute right-10 top-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute right-0 top-20 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-[13px] font-semibold text-white/80 md:text-base">{tx.balance}</p>
          <p className="mt-2 text-[32px] font-black text-white leading-none md:text-6xl">{Number(dorriBalance).toLocaleString()}</p>
          <p className="text-[14px] font-bold text-white/80 mt-1 md:text-lg">DORRI</p>
          <div className="flex gap-3 mt-6 md:mt-8 md:max-w-lg">
            <Link href="/wallet/add-funds"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8] md:h-14 md:text-base">
              <Plus size={16} strokeWidth={2.4} />{tx.charge}
            </Link>
            <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8] md:h-14 md:text-base">
              <ArrowLeftRight size={16} strokeWidth={2.4} />{tx.send}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between md:mx-0 md:mt-6 md:p-6 md:shadow-sm">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">{tx.address}</p>
          <p className="text-[12px] font-mono text-gray-700 mt-0.5">{wallet?.xrplAddress ?? '-'}</p>
        </div>
        <button onClick={copyAddress} className="flex items-center gap-1 text-[11px] font-bold text-[#7B5CF6] bg-purple-50 px-3 py-1.5 rounded-full">
          <Copy size={12} />{copied ? (lang === 'KOR' ? '복사됨' : 'Copied') : tx.copy}
        </button>
      </div>

        </section>
        <section className="md:rounded-[32px] md:bg-white md:p-8 md:shadow-[0_18px_48px_rgba(44,35,77,0.08)]">
      <div className="mx-5 mt-4 md:mx-0 md:mt-0">
        <h2 className="text-[15px] font-black text-[#232129] mb-3 md:text-2xl">{tx.history}</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto md:mb-6" style={{ scrollbarWidth: 'none' }}>
          {tx.tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border-2 transition md:px-5 md:py-2 md:text-sm
                ${activeTab === tab ? 'bg-[#7B5CF6] text-white border-[#7B5CF6]' : 'bg-white text-gray-500 border-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 md:gap-3">
          {filtered.map((item) => (
            <a key={item.id} href={item.explorerUrl} target="_blank" rel="noreferrer" className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 transition hover:border-purple-200 hover:shadow-sm md:p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${item.type === 'send' ? 'bg-red-50' : 'bg-green-50'}`}>
                <item.icon size={18} className={item.type === 'send' ? 'text-red-400' : 'text-green-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#232129] truncate">{item.desc}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.date} · {shortHash(item.txHash)}</p>
              </div>
              <div className="text-right">
                <p className={`text-[12px] font-black ${item.status === 'VALIDATED' ? 'text-green-600' : 'text-gray-500'}`}>{item.status}</p>
                <p className="text-[10px] text-gray-400">XRPL</p>
              </div>
            </a>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-[13px] font-semibold text-gray-400">
              {lang === 'KOR' ? '거래 내역이 없어요.' : 'No transactions yet.'}
            </div>
          )}
        </div>
        <button className="w-full mt-3 py-3 rounded-2xl border-2 border-gray-200 text-[13px] font-bold text-gray-500 flex items-center justify-center gap-1 md:mt-5 md:h-12 md:text-sm">
          {t[lang].more} <ChevronRight size={14} />
        </button>
      </div>
        </section>
      </div>
      <BottomNav />
    </div>
  )
}

function shortHash(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`
}

