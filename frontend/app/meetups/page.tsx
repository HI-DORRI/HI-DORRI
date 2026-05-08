'use client'
import { useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const meetups = [
  { id: '1', title: '서울 언어교환 모임', tag: '언어교환', members: 12, date: '5월 10일', emoji: '🗣️', loc: '마포구' },
  { id: '2', title: '한강 피크닉 클럽', tag: '아웃도어', members: 8, date: '5월 12일', emoji: '🌸', loc: '영등포구' },
  { id: '3', title: '홍대 보드게임 나이트', tag: '게임', members: 6, date: '5월 14일', emoji: '🎲', loc: '마포구' },
  { id: '4', title: '강남 러닝 크루', tag: '스포츠', members: 20, date: '5월 15일', emoji: '🏃', loc: '강남구' },
]

const tags = ['전체', '언어교환', '아웃도어', '게임', '스포츠', '문화']

export default function Meetups() {
  const [activeTag, setActiveTag] = useState('전체')
  const filtered = activeTag === '전체' ? meetups : meetups.filter(m => m.tag === activeTag)

  return (
    <div className="app-shell bg-gray-50 pb-24">
      <div className="px-5 pt-14 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900">밋업 탐색</h1>
        <input placeholder="🔍  밋업 검색"
          className="w-full mt-4 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-purple-400 transition" />
      </div>

      <div className="px-5 pt-3 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
        {tags.map(t => (
          <button key={t} onClick={() => setActiveTag(t)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition
              ${activeTag === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 flex flex-col gap-3">
        {filtered.map(m => (
          <Link key={m.id} href={`/meetups/${m.id}`}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex gap-4 items-center active:scale-95 transition">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{m.tag}</span>
              <p className="font-bold text-gray-900 mt-1 truncate">{m.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.date} · {m.loc} · {m.members}명</p>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}