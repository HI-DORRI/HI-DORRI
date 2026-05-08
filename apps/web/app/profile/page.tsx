'use client'
import { useState } from 'react'
import { ArrowLeft, Star, Edit2, MapPin, Globe, Calendar, ChevronRight, LogOut } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/BottomNav'

const tabs = ['내 정보', '참여 밋업', '호스트 내역']

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('내 정보')

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-24">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 bg-white border-b border-gray-100">
        <Link href="/home" className="p-2 -ml-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-[16px] font-black text-[#232129]">내 프로필</h1>
        <button className="p-2 -mr-2">
          <Edit2 size={18} className="text-[#7B5CF6]" />
        </button>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-white px-5 pt-6 pb-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-[3px] border-[#7B5CF6]">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                alt="profile"
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#7B5CF6] rounded-full flex items-center justify-center">
              <Edit2 size={11} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-[20px] font-black text-[#232129]">CryptoMagic</h2>
            <div className="flex items-center gap-1 mt-1">
              <Star size={13} fill="#7B5CF6" className="text-[#7B5CF6]" />
              <span className="text-[12px] font-bold text-[#7B5CF6]">실버 파트너</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin size={11} />
                서울, 한국
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <Globe size={11} />
                한국어, 영어
              </div>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label: '참여 밋업', value: '12' },
            { label: '호스트', value: '3' },
            { label: '신뢰 점수', value: '98%' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#F4F0FF] rounded-2xl p-3 text-center">
              <p className="text-[18px] font-black text-[#7B5CF6]">{stat.value}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 탭 */}
      <div className="flex bg-white border-b border-gray-100 mt-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[13px] font-bold transition border-b-2 ${
              activeTab === tab
                ? 'text-[#7B5CF6] border-[#7B5CF6]'
                : 'text-gray-400 border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div className="px-5 mt-4">
        {activeTab === '내 정보' && (
          <div className="flex flex-col gap-3">
            {/* 가입일 */}
            <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100">
              <Calendar size={18} className="text-[#7B5CF6]" />
              <div>
                <p className="text-[11px] text-gray-400 font-medium">가입일</p>
                <p className="text-[13px] font-bold text-[#232129] mt-0.5">2024년 3월 15일</p>
              </div>
            </div>

            {/* 메뉴 목록 */}
            {[
              { label: '계정 설정', desc: '이메일, 비밀번호 변경' },
              { label: '알림 설정', desc: '밋업 알림, 메시지 알림' },
              { label: '언어 설정', desc: '한국어' },
              { label: '개인정보 처리방침', desc: '' },
              { label: '이용약관', desc: '' },
            ].map(item => (
              <button
                key={item.label}
                className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100 w-full"
              >
                <div className="text-left">
                  <p className="text-[13px] font-bold text-[#232129]">{item.label}</p>
                  {item.desc && <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}

            {/* 로그아웃 */}
            <button className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-red-100 w-full mt-1">
              <LogOut size={18} className="text-red-400" />
              <span className="text-[13px] font-bold text-red-400">로그아웃</span>
            </button>
          </div>
        )}

        {activeTab === '참여 밋업' && (
          <div className="flex flex-col gap-3">
            {[
              { title: '서울 언어교환 모임', date: '2025년 4월 10일', emoji: '🗣️' },
              { title: '한강 피크닉 클럽', date: '2025년 3월 22일', emoji: '🌸' },
              { title: '홍대 보드게임 나이트', date: '2025년 3월 5일', emoji: '🎲' },
            ].map(m => (
              <div key={m.title} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
                  {m.emoji}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#232129]">{m.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === '호스트 내역' && (
          <div className="flex flex-col gap-3">
            {[
              { title: 'Seoul Crypto Meetup', date: '2025년 5월 10일', members: '0/20', emoji: '💜' },
            ].map(m => (
              <div key={m.title} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #C4B5FD)' }}>
                  {m.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[#232129]">{m.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{m.date} · 정원 {m.members}</p>
                </div>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">진행중</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}