'use client'
import { ArrowLeftRight, Bell, Menu, Plus, Star, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    greeting: 'CryptoMagic님',
    subtitle: '오늘도 멋진 밋업을 기대할게요',
    walletBalance: '내 지갑 잔액',
    charge: '충전하기',
    send: '송금하기',
    myMeetups: '내 밋업 관리',
    viewAll: '전체보기 →',
    noMeetup: '아직 개최한 밋업이 없어요',
    noMeetupDesc: '다양한 국가의 친구들과 함께하는 밋업을 직접 만들어보세요!',
    createMeetup: '밋업 만들기',
    hostGrade: '호스트 등급',
    hostLevel: '실버 파트너',
    unreadMsg: '읽지 않은 메시지',
    tipTitle: '인기 있는 호스트가 되는 팁',
    tipDesc: '신뢰도 높은\n프로필 만들기',
  },
  ENG: {
    greeting: 'CryptoMagic',
    subtitle: 'Ready for your next meetup?',
    walletBalance: 'My Wallet Balance',
    charge: 'Add Funds',
    send: 'Send',
    myMeetups: 'My Meetups',
    viewAll: 'View All →',
    noMeetup: 'No meetups hosted yet',
    noMeetupDesc: 'Create a meetup and connect with people from around the world!',
    createMeetup: 'Create Meetup',
    hostGrade: 'Host Grade',
    hostLevel: 'Silver Partner',
    unreadMsg: 'Unread Messages',
    tipTitle: 'Tips to become a popular host',
    tipDesc: 'Build a\ntrusted profile',
  }
}

export default function HomePage() {
  const { lang } = useLang()
  const tx = t[lang]

  return (
    <main className="app-shell min-h-screen bg-white pb-32 text-[#202024]">
      <header className="flex items-center justify-between px-5 pt-12 pb-4">
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
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-[22px] font-black text-[#232129]">{tx.greeting}</h1>
            <p className="text-[13px] text-[#4f4a5f] mt-0.5">{tx.subtitle}</p>
          </div>
          <div className="relative h-11 w-11 overflow-hidden rounded-full border-[3px] border-[#7B5CF6]">
            <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
              alt="profile" fill sizes="44px" className="object-cover" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#7446D8] px-5 py-5 text-white mt-5 shadow-[0_12px_24px_rgba(116,70,216,0.25)]">
          <div className="absolute right-[-28px] top-5 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-7 top-5 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute right-[-4px] top-16 h-24 w-24 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-[13px] font-semibold text-white/90">{tx.walletBalance}</p>
            <p className="mt-2 text-[28px] font-black leading-none">3,550.00 DORRI</p>
            <div className="mt-6 flex gap-3">
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

        <div className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-black text-[#232129]">{tx.myMeetups}</h2>
            <Link href="/meetups" className="text-[12px] font-semibold text-[#7B5CF6]">{tx.viewAll}</Link>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D9D1EA] bg-[#FBFAFF] px-8 py-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
              <Plus size={24} className="text-purple-400" />
            </div>
            <p className="text-[14px] font-black text-[#232129]">{tx.noMeetup}</p>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#656070]">{tx.noMeetupDesc}</p>
            <Link href="/meetups/create"
              className="mt-5 h-11 rounded-full bg-[#6F3FD7] px-8 text-[13px] font-bold text-white flex items-center justify-center">
              {tx.createMeetup}
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#F4F0FF] border border-[#E6DAFF] p-4">
            <Star size={18} className="text-[#7B5CF6] mb-2" fill="#7B5CF6" />
            <p className="text-[11px] text-[#656070] font-medium">{tx.hostGrade}</p>
            <p className="text-[14px] font-black text-[#232129] mt-0.5">{tx.hostLevel}</p>
          </div>
          <div className="rounded-2xl bg-[#F4F0FF] border border-[#E6DAFF] p-4">
            <MessageSquare size={18} className="text-[#7B5CF6] mb-2" />
            <p className="text-[11px] text-[#656070] font-medium">{tx.unreadMsg}</p>
            <p className="text-[14px] font-black text-[#232129] mt-0.5">0 {lang === 'KOR' ? '개' : ''}</p>
          </div>
        </div>

        <div className="mt-5 relative overflow-hidden rounded-2xl bg-[#1a1a2e] px-6 py-5 mb-5">
          <div className="absolute inset-0 opacity-40" style={{ background: 'linear-gradient(135deg, #6F3FD7, #1a1a2e)' }} />
          <div className="relative">
            <p className="text-[11px] font-semibold text-white/70">{tx.tipTitle}</p>
            <p className="text-[16px] font-black text-white mt-1 leading-snug whitespace-pre-line">{tx.tipDesc}</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}