'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'
import { getMeetups, type MeetupListItem } from '@/lib/domain'

const t = {
  KOR: {
    title: '밋업 탐색',
    searchPlaceholder: '밋업 검색',
    statusTabs: [
      { label: '진행중', status: 'PUBLISHED' },
      { label: '종료됨', status: 'CLOSED' },
    ],
    tags: ['전체', '언어교환', '아웃도어', '게임', '스포츠', '문화'],
    createMeetup: '밋업 생성',
  },
  ENG: {
    title: 'Explore Meetups',
    searchPlaceholder: 'Search meetups',
    statusTabs: [
      { label: 'Active', status: 'PUBLISHED' },
      { label: 'Closed', status: 'CLOSED' },
    ],
    tags: ['All', 'Language', 'Outdoor', 'Games', 'Sports', 'Culture'],
    createMeetup: 'Create Meetup',
  }
}

export default function Meetups() {
  const { lang } = useLang()
  const tx = t[lang]
  const [activeTag, setActiveTag] = useState(tx.tags[0])
  const [activeStatus, setActiveStatus] = useState(tx.statusTabs[0].status)
  const [apiMeetups, setApiMeetups] = useState<MeetupListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoading(true)
      getMeetups(activeStatus)
        .then((meetups) => {
          setApiMeetups(meetups)
          setError('')
        })
        .catch((error) => {
          setApiMeetups([])
          setError(error instanceof Error ? error.message : '밋업을 불러오지 못했어요.')
        })
        .finally(() => setIsLoading(false))
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [activeStatus])

  const sourceMeetups = apiMeetups.map((m) => ({
        id: m.id,
        title: { KOR: m.title, ENG: m.title },
        tag: { KOR: m.type, ENG: m.type },
        members: m.appliedCount,
        date: new Date(m.startsAt).toLocaleDateString(),
        emoji: m.type === 'PAID' ? 'P' : 'F',
        loc: { KOR: m.locationName, ENG: m.locationName },
      }))

  const filtered = sourceMeetups

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
            {tx.createMeetup}
          </Link>
        </div>
        <div className="md:mx-auto md:max-w-6xl md:px-8">
          <input placeholder={tx.searchPlaceholder}
            className="w-full mt-4 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-gray-50 text-sm outline-none focus:border-purple-400 transition md:h-14 md:max-w-xl md:bg-white md:px-5 md:text-base md:shadow-sm" />
        </div>
      </div>

      <div className="px-5 pt-4 flex items-center gap-2 md:mx-auto md:max-w-6xl md:px-8">
        {tx.statusTabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveStatus(tab.status)}
            className={`h-10 rounded-xl px-5 text-sm font-bold transition ${
              activeStatus === tab.status ? 'bg-[#7B5CF6] text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <Link
          href="/meetups/create"
          className="ml-auto flex h-10 shrink-0 items-center justify-center rounded-xl border border-[#7B5CF6] bg-white px-4 text-sm font-bold text-[#7B5CF6] shadow-sm md:hidden"
        >
          {tx.createMeetup}
        </Link>
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
        {isLoading && (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm font-semibold text-gray-400 md:col-span-2 lg:col-span-3">
            {lang === 'KOR' ? '밋업을 불러오는 중이에요.' : 'Loading meetups.'}
          </div>
        )}
        {!isLoading && error && (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-8 text-center text-sm font-semibold text-red-500 md:col-span-2 lg:col-span-3">
            {error}
          </div>
        )}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm font-semibold text-gray-400 md:col-span-2 lg:col-span-3">
            {lang === 'KOR' ? '등록된 밋업이 없어요.' : 'No meetups found.'}
          </div>
        )}
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

