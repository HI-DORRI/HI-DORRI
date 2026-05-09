'use client'
import { useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    title: '밋업 탐색',
    searchPlaceholder: '밋업 검색',
    tags: ['전체', '언어교환', '아웃도어', '게임', '스포츠', '문화'],
  },
  ENG: {
    title: 'Explore Meetups',
    searchPlaceholder: '?뵇  Search meetups',
    tags: ['All', 'Language', 'Outdoor', 'Games', 'Sports', 'Culture'],
  }
}

const meetups = [
  { id: '1', title: { KOR: '서울 언어교환 모임', ENG: 'Seoul Language Exchange' }, tag: { KOR: '언어교환', ENG: 'Language' }, members: 12, date: '5월 10일', emoji: 'A', loc: { KOR: '마포구', ENG: 'Mapo-gu' } },
  { id: '2', title: { KOR: '한강 피크닉 클럽', ENG: 'Han River Picnic Club' }, tag: { KOR: '아웃도어', ENG: 'Outdoor' }, members: 8, date: '5월 12일', emoji: 'P', loc: { KOR: '영등포구', ENG: 'Yeongdeungpo' } },
  { id: '3', title: { KOR: '홍대 보드게임 나이트', ENG: 'Hongdae Board Game Night' }, tag: { KOR: '게임', ENG: 'Games' }, members: 6, date: '5월 14일', emoji: 'G', loc: { KOR: '마포구', ENG: 'Mapo-gu' } },
  { id: '4', title: { KOR: '강남 러닝 크루', ENG: 'Gangnam Running Crew' }, tag: { KOR: '스포츠', ENG: 'Sports' }, members: 20, date: '5월 15일', emoji: 'R', loc: { KOR: '강남구', ENG: 'Gangnam-gu' } },
]

export default function Meetups() {
  const { lang } = useLang()
  const tx = t[lang]
  const [activeTag, setActiveTag] = useState(tx.tags[0])

  const filtered = activeTag === tx.tags[0]
    ? meetups
    : meetups.filter(m => m.tag[lang] === activeTag)

  return (
    <div className="app-shell bg-gray-50 pb-24 md:min-h-screen md:bg-[#F6F3FF] md:pb-12 md:pt-24">
      <div className="px-5 pt-2 pb-4 bg-white border-b border-gray-100 md:border-none md:bg-transparent md:px-8 md:pt-6 md:pb-6">
        <div className="md:mx-auto md:flex md:max-w-6xl md:items-end md:justify-between md:gap-8 md:px-8">
          <div>
            <p className="hidden text-sm font-bold uppercase tracking-wide text-[#7B5CF6] md:block">Meetups</p>
            <h1 className="text-2xl font-black text-gray-900 md:mt-2 md:text-4xl">{tx.title}</h1>
          </div>
          <Link
            href="/meetups/create"
            className="mt-4 hidden h-12 items-center justify-center rounded-xl bg-[#7B5CF6] px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(123,92,246,0.22)] md:flex"
          >
            Create Meetup
          </Link>
        </div>
        <div className="md:mx-auto md:max-w-6xl md:px-8">
          <input placeholder={tx.searchPlaceholder}
            className="w-full mt-4 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-purple-400 transition md:h-14 md:max-w-xl md:bg-white md:px-5 md:text-base md:shadow-sm" />
        </div>
      </div>

      <div className="px-5 pt-3 flex gap-2 overflow-x-auto pb-2 md:mx-auto md:max-w-6xl md:px-8 md:pt-2" style={{ scrollbarWidth: 'none' }}>
        {tx.tags.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition md:px-5 md:py-2.5
              ${activeTag === tag ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}>
            {tag}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 flex flex-col gap-3 md:mx-auto md:mt-6 md:grid md:max-w-6xl md:grid-cols-2 md:gap-5 md:px-8 lg:grid-cols-3">
        {filtered.map(m => (
          <Link key={m.id} href={`/meetups/${m.id}`}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex gap-4 items-center active:scale-95 transition md:min-h-44 md:flex-col md:items-start md:justify-between md:p-6 md:shadow-[0_14px_34px_rgba(44,35,77,0.08)] md:hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 md:h-16 md:w-16 md:text-4xl"
              style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
              {m.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{m.tag[lang]}</span>
              <p className="font-bold text-gray-900 mt-1 truncate">{m.title[lang]}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.date} · {m.loc[lang]} · {m.members}{lang === 'KOR' ? '명' : ' people'}</p>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}

