'use client'
import { ArrowLeftRight, Bell, Menu, Plus, Search, User, WalletCards } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    greeting: 'CryptoMagic님',
    subtitle: '오늘도 멋진 밋업을 기대할게요',
    walletLabel: '내 지갑',
    charge: '충전하기',
    exchange: '송금하기',
    quickStart: '빠른 시작',
    quickActions: [
      { label: '충전하기', emoji: '💰' },
      { label: '탐색하기', emoji: '🔍' },
      { label: '프로필 설정', emoji: '👤' },
    ],
    myMeetups: '내 밋업',
    seeAll: '전체보기 →',
    noMeetup: '예정된 밋업이 없어요',
    noMeetupDesc: '주변의 새로운 사람들과 환전 기회를 발견해보세요.',
    exploreMeetups: '밋업 탐색',
    spotlight: 'Community Spotlight',
    spotlightDesc: 'David가 지난 밋업에서 15% 절약한 방법',
  },
  ENG: {
    greeting: 'Hi, Sarah!',
    subtitle: 'Your global journey continues.',
    walletLabel: 'My Wallet',
    charge: 'Add Funds',
    exchange: 'Exchange',
    quickStart: 'Quick Start',
    quickActions: [
      { label: 'Add Funds', emoji: '💰' },
      { label: 'Explore', emoji: '🔍' },
      { label: 'Set your Profile', emoji: '👤' },
    ],
    myMeetups: 'My Meetups',
    seeAll: 'See All →',
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

  return (
    <main className="app-shell min-h-screen bg-white pb-32 text-[#202024]">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-gray-100">
        <button aria-label="Open menu">
          <Menu size={22} strokeWidth={2.4} className="text-[#232129]" />
        </button>
        <Image src="/images/small logo2.png" alt="HI-DORRI" width={72} height={30} priority className="h-auto w-[72px]" />
        <button aria-label="Notifications" className="relative">
          <Bell size={22} strokeWidth={2.2} className="text-[#232129]" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">1</span>
        </button>
      </header>

      <div className="px-5">
        {/* 인사 */}
        <div className="flex items-center justify-between mt-5">
          <div>
            <h1 className="text-[22px] font-black text-[#232129]">{tx.greeting}</h1>
            <p className="text-[13px] text-[#4f4a5f] mt-0.5">{tx.subtitle}</p>
          </div>
          <div className="relative h-11 w-11 overflow-hidden rounded-full border-[3px] border-[#7B5CF6]">
            <Image
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
              alt="profile" fill sizes="44px" className="object-cover" />
          </div>
        </div>

        {/* 지갑 카드 */}
        <div className="relative overflow-hidden rounded-2xl bg-[#7446D8] px-5 py-5 text-white mt-5 shadow-[0_12px_24px_rgba(116,70,216,0.25)]">
          <div className="absolute right-[-20px] top-[-20px] h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute right-10 top-4 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-[-10px] top-16 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-[13px] font-semibold text-white/80">{tx.walletLabel}</p>
            <p className="mt-2 text-[32px] font-black leading-none">0 DORRI</p>
            <div className="mt-6 flex gap-3">
              <Link href="/wallet/add-funds"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8]">
                <Plus size={16} strokeWidth={2.4} />{tx.charge}
              </Link>
              <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold text-[#7446D8]">
                <ArrowLeftRight size={16} strokeWidth={2.4} />{tx.exchange}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="mt-6">
          <h2 className="text-[15px] font-black text-[#232129] mb-3">{tx.quickStart}</h2>
          <div className="rounded-2xl border border-[#E6DAFF] bg-[#FBFAFF] px-4 py-5">
            <div className="grid grid-cols-3 gap-2">
              {tx.quickActions.map((action, i) => (
                <button key={i}
                  className="flex flex-col items-center justify-center gap-2 h-[78px] rounded-xl border border-[#E9DFFF] bg-[#F4F0FF]">
                  <span className="text-2xl">{action.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight text-[#25232D] text-center">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* My Meetups */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-black text-[#232129]">{tx.myMeetups}</h2>
            <Link href="/meetups" className="text-[12px] font-semibold text-[#7B5CF6]">{tx.seeAll}</Link>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D9D1EA] bg-[#FBFAFF] px-8 py-10 text-center">
            <WalletCards size={25} className="mb-3 text-[#D6CCE9]" />
            <p className="text-[13px] font-black text-[#232129]">{tx.noMeetup}</p>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#656070]">{tx.noMeetupDesc}</p>
            <Link href="/meetups"
              className="mt-5 h-11 rounded-full bg-[#6F3FD7] px-8 text-[13px] font-bold text-white flex items-center justify-center">
              {tx.exploreMeetups}
            </Link>
          </div>
        </div>

        {/* Community Spotlight */}
        <div className="mt-5 mb-5 relative h-[140px] overflow-hidden rounded-2xl bg-[#332A42]">
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