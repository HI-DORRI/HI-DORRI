'use client'
import { useEffect, useState } from 'react'
import { ArrowLeftRight, Bell, Menu, Plus, WalletCards } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'
import { getHome, refreshDorriBalance, type HomeData } from '@/lib/domain'

const t = {
  KOR: {
    greeting: '안녕하세요, Sarah!',
    subtitle: '오늘도 글로벌 여정을 이어가세요.',
    walletLabel: '내 지갑',
    charge: '충전하기',
    exchange: '송금하기',
    quickStart: '빠른 시작',
    quickActions: [
      { label: '충전하기', emoji: '$', href: '/wallet/add-funds' },
      { label: '탐색하기', emoji: 'Q', href: '/meetups' },
      { label: '프로필 설정', emoji: 'U', href: '/profile' },
    ],
    myMeetups: '내 밋업',
    seeAll: '전체보기 ->',
    noMeetup: '예정된 밋업이 없어요',
    noMeetupDesc: '주변의 새로운 사람들과 환전 기회를 찾아보세요.',
    exploreMeetups: '밋업 탐색',
    spotlight: 'Community Spotlight',
    spotlightDesc: 'David가 지난 밋업에서 15%를 절약한 방법',
  },
  ENG: {
    greeting: 'Hi, Sarah!',
    subtitle: 'Your global journey continues.',
    walletLabel: 'My Wallet',
    charge: 'Add Funds',
    exchange: 'Exchange',
    quickStart: 'Quick Start',
    quickActions: [
      { label: 'Add Funds', emoji: '$', href: '/wallet/add-funds' },
      { label: 'Explore', emoji: 'Q', href: '/meetups' },
      { label: 'Set your Profile', emoji: 'U', href: '/profile' },
    ],
    myMeetups: 'My Meetups',
    seeAll: 'See All ->',
    noMeetup: 'No upcoming meetups yet',
    noMeetupDesc: 'Discover new people and currency exchange opportunities near you.',
    exploreMeetups: 'Explore Meetups',
    spotlight: 'Community Spotlight',
    spotlightDesc: 'How David saved 15% on his last meetup',
  }
}

export default function HomePage() {
  const { lang } = useLang()
  const tx = t[lang]
  const [home, setHome] = useState<HomeData | null>(null)

  useEffect(() => {
    getHome()
      .then((data) => {
        setHome(data)
        return refreshDorriBalance(2, 1000)
      })
      .then((dorri) => {
        setHome((current) => current ? { ...current, dorri } : current)
      })
      .catch(() => setHome(null))
  }, [])

  if (!home) {
    return <HomeSkeleton />
  }

  const name = home.user.name
  const balance = home.dorri?.balance ?? '0'
  const reviewMeetup = home?.myMeetups.find((item) => item.status === 'CHECKED_IN' && item.meetup.status === 'CLOSED')
  const myMeetup = reviewMeetup ?? home?.myMeetups[0]

  return (
    <main className="app-shell min-h-screen bg-white pb-32 text-[#202024] md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-2 pb-4 border-b border-gray-100 md:hidden">
        <button aria-label="Open menu">
          <Menu size={22} strokeWidth={2.4} className="text-[#232129]" />
        </button>
        <Image src="/images/small logo2.png" alt="HI-DORRI" width={72} height={30} priority style={{ height: 'auto' }} />
        <button aria-label="Notifications" className="relative">
          <Bell size={22} strokeWidth={2.2} className="text-[#232129]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">1</span>
        </button>
      </header>

      <div className="px-5 md:mx-auto md:grid md:max-w-6xl md:grid-cols-[minmax(0,1.15fr)_420px] md:items-start md:gap-6 md:px-0">
        {/* Greeting */}
        <div className="flex items-center justify-between mt-5 md:col-span-2 md:mt-0 md:rounded-[28px] md:bg-white md:p-8 md:shadow-[0_14px_34px_rgba(44,35,77,0.07)]">
          <div>
            <h1 className="text-[22px] font-black text-[#232129] md:text-4xl">{lang === 'KOR' ? `안녕하세요, ${name}!` : `Hi, ${name}!`}</h1>
            <p className="text-[13px] text-[#4f4a5f] mt-0.5 md:mt-2 md:text-base">{tx.subtitle}</p>
          </div>
          <div className="relative h-11 w-11 overflow-hidden rounded-full border-[3px] border-[#7B5CF6]">
            <Image
              src={home?.user.profileImageUrl ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'}
              alt="profile" fill sizes="44px" className="object-cover" />
          </div>
        </div>

        {/* Wallet card */}
        <div className="relative overflow-hidden rounded-2xl bg-[#7446D8] px-5 py-5 text-white mt-5 shadow-[0_12px_24px_rgba(116,70,216,0.25)] md:mt-0 md:min-h-[250px] md:self-start md:rounded-[28px] md:px-8 md:py-8">
          <div className="absolute right-[-20px] top-[-20px] h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute right-10 top-4 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-[-10px] top-16 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative md:flex md:min-h-[186px] md:flex-col md:justify-between">
            <p className="text-[13px] font-semibold text-white/80 md:text-base">{tx.walletLabel}</p>
            <p className="mt-2 text-[32px] font-black leading-none md:text-5xl">{Number(balance).toLocaleString()} DORRI</p>
            <div className="mt-6 flex gap-3 md:max-w-lg">
              <Link href="/wallet/add-funds"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8] md:h-12 md:text-sm">
                <Plus size={16} strokeWidth={2.4} />{tx.charge}
              </Link>
              <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8] md:h-12 md:text-sm">
                <ArrowLeftRight size={16} strokeWidth={2.4} />{tx.exchange}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-6 md:mt-0 md:rounded-[28px] md:bg-white md:p-7 md:shadow-[0_14px_34px_rgba(44,35,77,0.07)]">
          <h2 className="text-[15px] font-black text-[#232129] mb-3 md:text-xl">{tx.quickStart}</h2>
          <div className="rounded-2xl border border-[#E6DAFF] bg-[#FBFAFF] px-4 py-5 md:border-none md:bg-transparent md:p-0">
            <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
              {tx.quickActions.map((action, i) => (
                <Link key={i} href={action.href}
                  className="flex flex-col items-center justify-center gap-2 h-[78px] rounded-xl border border-[#E9DFFF] bg-[#F4F0FF] md:h-[92px]">
                  <span className="text-2xl">{action.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight text-[#25232D] text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* My Meetups */}
        <div className="mt-6 md:rounded-[28px] md:bg-white md:p-8 md:shadow-[0_14px_34px_rgba(44,35,77,0.07)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-black text-[#232129]">{tx.myMeetups}</h2>
            <Link href="/meetups" className="text-[12px] font-semibold text-[#7B5CF6]">{tx.seeAll}</Link>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D9D1EA] bg-[#FBFAFF] px-8 py-10 text-center">
            <WalletCards size={25} className="mb-3 text-[#D6CCE9]" />
            <p className="text-[13px] font-black text-[#232129]">{reviewMeetup ? '리뷰를 작성해 주세요' : myMeetup?.meetup.title ?? tx.noMeetup}</p>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#656070]">
              {reviewMeetup ? `${reviewMeetup.meetup.title} 밋업이 종료되었어요.` : myMeetup ? new Date(myMeetup.meetup.startsAt).toLocaleDateString() : tx.noMeetupDesc}
            </p>
            <Link href={reviewMeetup ? `/meetups/${reviewMeetup.meetup.id}/review` : myMeetup ? `/meetups/${myMeetup.meetup.id}` : '/meetups'}
              className="mt-5 h-11 rounded-full bg-[#6F3FD7] px-8 text-[13px] font-bold text-white flex items-center justify-center">
              {reviewMeetup ? '리뷰 작성하기' : tx.exploreMeetups}
            </Link>
          </div>
        </div>

        {/* Community Spotlight */}
        <div className="mt-5 mb-5 relative h-[140px] overflow-hidden rounded-2xl bg-[#332A42] md:mb-0 md:mt-6 md:h-[260px] md:rounded-[28px] md:shadow-[0_14px_34px_rgba(44,35,77,0.1)]">
          <Image
            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80"
            alt="" fill sizes="350px" className="object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <p className="text-[14px] font-black">{tx.spotlight}</p>
            <p className="mt-1 text-[12px] font-medium text-white/90">{tx.spotlightDesc}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}

function HomeSkeleton() {
  return (
    <main className="app-shell min-h-screen bg-white pb-32 text-[#202024] md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 pb-4 pt-2 md:hidden">
        <div className="h-6 w-6 rounded bg-gray-100" />
        <div className="h-8 w-20 rounded bg-gray-100" />
        <div className="h-6 w-6 rounded bg-gray-100" />
      </header>
      <div className="px-5 md:mx-auto md:grid md:max-w-6xl md:grid-cols-[minmax(0,1.15fr)_420px] md:items-start md:gap-6 md:px-0">
        <div className="mt-5 rounded-[28px] bg-white md:col-span-2 md:mt-0 md:p-8 md:shadow-[0_14px_34px_rgba(44,35,77,0.07)]">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100 md:h-10" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="mt-5 h-[210px] animate-pulse rounded-2xl bg-purple-100 md:mt-0 md:h-[250px] md:rounded-[28px]" />
        <div className="mt-6 h-[220px] animate-pulse rounded-[28px] bg-gray-100 md:mt-0" />
        <div className="mt-6 h-[230px] animate-pulse rounded-[28px] bg-gray-100" />
        <div className="mt-5 h-[140px] animate-pulse rounded-2xl bg-gray-100 md:mt-6 md:h-[260px] md:rounded-[28px]" />
      </div>
      <BottomNav />
    </main>
  )
}

