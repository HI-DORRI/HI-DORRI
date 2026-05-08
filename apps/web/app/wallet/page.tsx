'use client'
import { useState } from 'react'
import { Plus, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'

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

const transactions = [
  { type: 'charge', desc: { KOR: '카드 충전', ENG: 'Card Deposit' }, amount: '+500.00', date: '2025.05.08', icon: ArrowDownLeft },
  { type: 'send', desc: { KOR: 'Seoul Crypto Meetup 참가비', ENG: 'Seoul Crypto Meetup Fee' }, amount: '-30.00', date: '2025.05.07', icon: ArrowUpRight },
  { type: 'settle', desc: { KOR: '밋업 종료 후 정산', ENG: 'Meetup Settlement' }, amount: '+280.00', date: '2025.05.01', icon: ArrowDownLeft },
  { type: 'charge', desc: { KOR: '카드 충전', ENG: 'Card Deposit' }, amount: '+1000.00', date: '2025.04.28', icon: ArrowDownLeft },
  { type: 'send', desc: { KOR: '한강 피크닉 클럽 참가비', ENG: 'Han River Picnic Fee' }, amount: '-20.00', date: '2025.04.20', icon: ArrowUpRight },
]

export default function WalletPage() {
  const { lang } = useLang()
  const tx = t[lang]
  const [activeTab, setActiveTab] = useState(tx.tabs[0])

  const filtered = activeTab === tx.tabs[0]
    ? transactions
    : transactions.filter(t =>
        activeTab === tx.tabs[1] ? t.type === 'charge'
        : activeTab === tx.tabs[2] ? t.type === 'send'
        : t.type === 'settle'
      )

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-24">
      <div className="relative overflow-hidden px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #7446D8, #5B21B6)' }}>
        <div className="absolute right-[-28px] top-5 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute right-10 top-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute right-0 top-20 h-28 w-28 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-[13px] font-semibold text-white/80">{tx.balance}</p>
          <p className="mt-2 text-[32px] font-black text-white leading-none">3,550.00</p>
          <p className="text-[14px] font-bold text-white/80 mt-1">DORRI</p>
          <div className="flex gap-3 mt-6">
            <Link href="/wallet/add-funds"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8]">
              <Plus size={16} strokeWidth={2.4} />{tx.charge}
            </Link>
            <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8]">
              <ArrowLeftRight size={16} strokeWidth={2.4} />{tx.send}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">{tx.address}</p>
          <p className="text-[12px] font-mono text-gray-700 mt-0.5">0x7f3a...b9c2e1d4</p>
        </div>
        <button className="text-[11px] font-bold text-[#7B5CF6] bg-purple-50 px-3 py-1.5 rounded-full">{tx.copy}</button>
      </div>

      <div className="mx-5 mt-4">
        <h2 className="text-[15px] font-black text-[#232129] mb-3">{tx.history}</h2>
        <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tx.tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border-2 transition
                ${activeTab === tab ? 'bg-[#7B5CF6] text-white border-[#7B5CF6]' : 'bg-white text-gray-500 border-gray-200'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((tx, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${tx.type === 'send' ? 'bg-red-50' : 'bg-green-50'}`}>
                <tx.icon size={18} className={tx.type === 'send' ? 'text-red-400' : 'text-green-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#232129] truncate">{tx.desc[lang as 'KOR' | 'ENG']}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-[14px] font-black ${tx.type === 'send' ? 'text-red-500' : 'text-green-600'}`}>{tx.amount}</p>
                <p className="text-[10px] text-gray-400">DORRI</p>
              </div>
            </div>
          ))}
        </div>
        <button className="w-full mt-3 py-3 rounded-2xl border-2 border-gray-200 text-[13px] font-bold text-gray-500 flex items-center justify-center gap-1">
          {t[lang].more} <ChevronRight size={14} />
        </button>
      </div>
      <BottomNav />
    </div>
  )
}