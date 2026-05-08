'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronRight } from 'lucide-react'

const settlements = [
  {
    id: '1',
    title: 'Seoul Crypto Meetup',
    date: '2025년 5월 10일',
    emoji: '💜',
    participants: 18,
    capacity: 20,
    fee: 30,
    deposit: 200,
    status: 'completed',
    total: 540,
  },
  {
    id: '2',
    title: '서울 언어교환 모임',
    date: '2025년 4월 20일',
    emoji: '🗣️',
    participants: 12,
    capacity: 12,
    fee: 0,
    deposit: 200,
    status: 'completed',
    total: 200,
  },
]

export default function SettlementPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)

  const selectedItem = settlements.find(s => s.id === selected)

  if (selected && selectedItem) {
    return (
      <div className="app-shell bg-white min-h-dvh pb-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
          <button onClick={() => setSelected(null)} className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[16px] font-black text-[#232129]">정산 상세</h1>
          <div className="w-8" />
        </div>

        <div className="px-5 mt-6 flex flex-col gap-4">
          {/* 정산 완료 배지 */}
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check size={30} className="text-green-500" strokeWidth={3} />
            </div>
            <h2 className="text-[20px] font-black text-[#232129]">정산 완료!</h2>
            <p className="text-[13px] text-gray-400 mt-1">{selectedItem.date}</p>
          </div>

          {/* 밋업 정보 */}
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
              {selectedItem.emoji}
            </div>
            <div>
              <p className="text-[14px] font-black text-[#232129]">{selectedItem.title}</p>
              <p className="text-[12px] text-gray-400 mt-0.5">{selectedItem.date}</p>
            </div>
          </div>

          {/* 정산 내역 */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[14px] font-black text-[#232129]">정산 내역</p>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              <div className="flex justify-between px-4 py-3">
                <span className="text-[13px] text-gray-500">참가자 수</span>
                <span className="text-[13px] font-bold text-[#232129]">{selectedItem.participants}/{selectedItem.capacity}명</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-[13px] text-gray-500">참가비</span>
                <span className="text-[13px] font-bold text-[#232129]">{selectedItem.fee} DORRI × {selectedItem.participants}명</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-[13px] text-gray-500">호스트 보증금 반환</span>
                <span className="text-[13px] font-bold text-green-600">+{selectedItem.deposit} DORRI</span>
              </div>
              <div className="flex justify-between px-4 py-4 bg-purple-50">
                <span className="text-[14px] font-black text-[#232129]">최종 정산액</span>
                <span className="text-[16px] font-black text-[#7B5CF6]">+{selectedItem.total} DORRI</span>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <button
            onClick={() => router.push('/home')}
            className="w-full py-4 rounded-2xl font-bold text-white text-[15px] mt-2"
            style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[16px] font-black text-[#232129]">정산 내역</h1>
        <div className="w-8" />
      </div>

      {/* 총 정산액 */}
      <div className="mx-5 mt-5 rounded-2xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #7446D8, #5B21B6)' }}>
        <p className="text-[13px] text-white/80 font-medium">총 정산액</p>
        <p className="text-[28px] font-black mt-1">740 DORRI</p>
        <p className="text-[12px] text-white/60 mt-1">총 2건 정산 완료</p>
      </div>

      {/* 정산 목록 */}
      <div className="px-5 mt-5 flex flex-col gap-3">
        <h2 className="text-[15px] font-black text-[#232129]">정산 내역</h2>
        {settlements.map(s => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 w-full text-left"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-[#232129] truncate">{s.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.date}</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <p className="text-[14px] font-black text-green-600">+{s.total}</p>
                <p className="text-[10px] text-gray-400">DORRI</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}