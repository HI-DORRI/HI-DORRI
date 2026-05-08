'use client'
import { useState } from 'react'
import { Plus, ArrowLeftRight, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const tabs = ['전체', '충전', '송금', '정산']

const transactions = [
  { type: 'charge', label: '충전', desc: '카드 충전', amount: '+500.00', date: '2025.05.08', icon: ArrowDownLeft },
  { type: 'send', label: '송금', desc: 'Seoul Crypto Meetup 참가비', amount: '-30.00', date: '2025.05.07', icon: ArrowUpRight },
  { type: 'settle', label: '정산', desc: '밋업 종료 후 정산', amount: '+280.00', date: '2025.05.01', icon: ArrowDownLeft },
  { type: 'charge', label: '충전', desc: '카드 충전', amount: '+1000.00', date: '2025.04.28', icon: ArrowDownLeft },
  { type: 'send', label: '송금', desc: '한강 피크닉 클럽 참가비', amount: '-20.00', date: '2025.04.20', icon: ArrowUpRight },
]

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState('전체')

  const filtered = activeTab === '전체'
    ? transactions
    : transactions.filter(t =>
        activeTab === '충전' ? t.type === 'charge'
        : activeTab === '송금' ? t.type === 'send'
        : t.type === 'settle'
      )

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-24">
      {/* 지갑 카드 */}
      <div className="relative overflow-hidden px-5 pt-14 pb-8"
        style={{ background: 'linear-gradient(160deg, #7446D8, #5B21B6)' }}>
        <div className="absolute right-[-28px] top-5 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute right-10 top-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute right-0 top-20 h-28 w-28 rounded-full bg-white/10" />

        <div className="relative">
          <p className="text-[13px] font-semibold text-white/80">내 지갑 잔액</p>
          <p className="mt-2 text-[32px] font-black text-white leading-none">3,550.00</p>
          <p className="text-[14px] font-bold text-white/80 mt-1">DORRI</p>

          <div className="flex gap-3 mt-6">
            <Link
              href="/wallet/add-funds"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8]"
            >
              <Plus size={16} strokeWidth={2.4} />
              충전하기
            </Link>
            <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8]">
              <ArrowLeftRight size={16} strokeWidth={2.4} />
              송금하기
            </button>
          </div>
        </div>
      </div>

      {/* 내 지갑 주소 */}
      <div className="mx-5 mt-4 bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-gray-400 font-medium">내 지갑 주소</p>
          <p className="text-[12px] font-mono text-gray-700 mt-0.5">0x7f3a...b9c2e1d4</p>
        </div>
        <button className="text-[11px] font-bold text-[#7B5CF6] bg-purple-50 px-3 py-1.5 rounded-full">
          복사
        </button>
      </div>

      {/* 거래 내역 */}
      <div className="mx-5 mt-4">
        <h2 className="text-[15px] font-black text-[#232129] mb-3">거래 내역</h2>

        {/* 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[12px] font-bold border-2 transition
                ${activeTab === tab
                  ? 'bg-[#7B5CF6] text-white border-[#7B5CF6]'
                  : 'bg-white text-gray-500 border-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 거래 목록 */}
        <div className="flex flex-col gap-2">
          {filtered.map((tx, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${tx.type === 'send' ? 'bg-red-50' : 'bg-green-50'}`}>
                <tx.icon size={18} className={tx.type === 'send' ? 'text-red-400' : 'text-green-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-[#232129] truncate">{tx.desc}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{tx.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-[14px] font-black ${tx.type === 'send' ? 'text-red-500' : 'text-green-600'}`}>
                  {tx.amount}
                </p>
                <p className="text-[10px] text-gray-400">DORRI</p>
              </div>
            </div>
          ))}
        </div>

        {/* 더보기 */}
        <button className="w-full mt-3 py-3 rounded-2xl border-2 border-gray-200 text-[13px] font-bold text-gray-500 flex items-center justify-center gap-1">
          더보기 <ChevronRight size={14} />
        </button>
      </div>

      <BottomNav />
    </div>
  )
}