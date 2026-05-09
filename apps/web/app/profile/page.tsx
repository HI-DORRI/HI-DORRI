'use client'
import { useState } from 'react'
import { ArrowLeft, Star, Edit2, MapPin, Globe, Calendar, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    title: '내 프로필',
    hostGrade: '실버 파트너',
    location: '서울, 한국',
    languages: '한국어, 영어',
    stats: ['참여 밋업', '호스트', '신뢰 점수'],
    tabs: ['내 정보', '참여 밋업', '호스트 이력'],
    joinDate: '가입일',
    joinDateVal: '2024년 3월 15일',
    menu: [
      { label: '계정 설정', desc: '이메일, 비밀번호 변경' },
      { label: '알림 설정', desc: '밋업 알림, 메시지 알림' },
      { label: '언어 설정', desc: '한국어' },
      { label: '개인정보 처리방침', desc: '' },
      { label: '이용약관', desc: '' },
    ],
    logout: '로그아웃',
    noHost: '호스트 이력 없음',
    ongoing: '진행중',
  },
  ENG: {
    title: 'My Profile',
    hostGrade: 'Silver Partner',
    location: 'Seoul, Korea',
    languages: 'Korean, English',
    stats: ['Meetups', 'Hosted', 'Trust Score'],
    tabs: ['Info', 'Joined', 'Hosted'],
    joinDate: 'Member Since',
    joinDateVal: 'March 15, 2024',
    menu: [
      { label: 'Account Settings', desc: 'Email, password' },
      { label: 'Notifications', desc: 'Meetup & message alerts' },
      { label: 'Language', desc: 'English' },
      { label: 'Privacy Policy', desc: '' },
      { label: 'Terms of Service', desc: '' },
    ],
    logout: 'Log Out',
    noHost: 'No hosting history',
    ongoing: 'Ongoing',
  }
}

export default function ProfilePage() {
  const { lang } = useLang()
  const tx = t[lang]
  const [activeTab, setActiveTab] = useState(tx.tabs[0])

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-24 md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      <div className="flex items-center justify-between px-5 pt-2 pb-4 bg-white border-b border-gray-100 md:mx-auto md:max-w-6xl md:rounded-t-[32px] md:border-none md:px-8 md:pt-8">
        <Link href="/home" className="p-2 -ml-2"><ArrowLeft size={20} /></Link>
        <h1 className="text-[16px] font-black text-[#232129] md:text-2xl">{tx.title}</h1>
        <button className="p-2 -mr-2"><Edit2 size={18} className="text-[#7B5CF6]" /></button>
      </div>

      <div className="bg-white px-5 pt-6 pb-5 md:mx-auto md:max-w-6xl md:px-8 md:pb-8 md:pt-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="relative">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-[3px] border-[#7B5CF6] md:h-28 md:w-28">
              <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                alt="profile" fill sizes="80px" className="object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#7B5CF6] rounded-full flex items-center justify-center">
              <Edit2 size={11} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-[20px] font-black text-[#232129] md:text-4xl">CryptoMagic</h2>
            <div className="flex items-center gap-1 mt-1">
              <Star size={13} fill="#7B5CF6" className="text-[#7B5CF6]" />
              <span className="text-[12px] font-bold text-[#7B5CF6]">{tx.hostGrade}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin size={11} />{tx.location}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Globe size={11} />{tx.languages}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 md:mt-8 md:max-w-2xl md:gap-4">
          {[{ label: tx.stats[0], value: '12' }, { label: tx.stats[1], value: '3' }, { label: tx.stats[2], value: '98%' }].map(stat => (
            <div key={stat.label} className="bg-[#F4F0FF] rounded-2xl p-3 text-center md:p-5">
              <p className="text-[18px] font-black text-[#7B5CF6] md:text-3xl">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 font-medium md:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex bg-white border-b border-gray-100 mt-2 md:mx-auto md:mt-0 md:max-w-6xl md:border-t md:px-8">
        {tx.tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-bold transition border-b-2
              ${activeTab === tab ? 'text-[#7B5CF6] border-[#7B5CF6]' : 'text-gray-400 border-transparent'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 md:mx-auto md:mt-6 md:max-w-6xl md:px-0">
        {activeTab === tx.tabs[0] && (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 md:p-6">
              <Calendar size={18} className="text-[#7B5CF6]" />
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{tx.joinDate}</p>
                <p className="text-[13px] font-bold text-[#232129] mt-0.5">{tx.joinDateVal}</p>
              </div>
            </div>
            {tx.menu.map(item => (
              <button key={item.label}
                className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100 w-full md:p-6">
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#232129]">{item.label}</p>
                  {item.desc && <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
            <button className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-red-100 w-full mt-1 md:p-6">
              <LogOut size={18} className="text-red-400" />
              <span className="text-[13px] font-bold text-red-400">{tx.logout}</span>
            </button>
          </div>
        )}

        {activeTab === tx.tabs[1] && (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            {[
              { title: { KOR: '서울 언어교환 모임', ENG: 'Seoul Language Exchange' }, date: '2025년 4월 10일', emoji: 'A' },
              { title: { KOR: '한강 피크닉 클럽', ENG: 'Han River Picnic Club' }, date: '2025년 3월 22일', emoji: 'P' },
              { title: { KOR: '홍대 보드게임 나이트', ENG: 'Hongdae Board Game Night' }, date: '2025년 3월 5일', emoji: 'G' },
            ].map(m => (
              <div key={m.title.KOR} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 md:p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
                  {m.emoji}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#232129]">{m.title[lang]}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === tx.tabs[2] && (
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-4">
            {[{ title: { KOR: 'Seoul Crypto Meetup', ENG: 'Seoul Crypto Meetup' }, date: '2025년 5월 10일', members: '0/20', emoji: 'D' }].map(m => (
              <div key={m.title.KOR} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 md:p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#232129]">{m.title[lang]}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.date} 쨌 {m.members}</p>
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">{tx.ongoing}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

