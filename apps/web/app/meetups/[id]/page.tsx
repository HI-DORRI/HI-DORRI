'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, Check } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    apply: '참여 신청하기',
    applied: '참여 신청 완료!',
    applyTitle: '참여 신청',
    fee: '참가비',
    free: '무료',
    date: '날짜',
    location: '장소',
    cancel: '취소',
    confirm: '신청 확인',
    participants: '명 참여 중',
  },
  ENG: {
    apply: 'Apply to Join',
    applied: 'Application Complete!',
    applyTitle: 'Apply',
    fee: 'Entry Fee',
    free: 'Free',
    date: 'Date',
    location: 'Location',
    cancel: 'Cancel',
    confirm: 'Confirm',
    participants: ' participants',
  }
}

const data: Record<string, {
  title: { KOR: string; ENG: string }
  tag: { KOR: string; ENG: string }
  emoji: string
  date: string
  loc: { KOR: string; ENG: string }
  desc: { KOR: string; ENG: string }
  members: number
  fee: number
}> = {
  '1': {
    title: { KOR: '서울 언어교환 모임', ENG: 'Seoul Language Exchange' },
    tag: { KOR: '언어교환', ENG: 'Language' },
    emoji: '🗣️',
    date: '2025년 5월 10일 오후 3시',
    loc: { KOR: '마포구 홍대입구역 근처', ENG: 'Near Hongdae Station, Mapo-gu' },
    desc: { KOR: '한국어와 영어를 교환하며 배우는 모임이에요. 초급부터 고급까지 누구나 환영합니다!', ENG: 'A meetup to exchange Korean and English. All levels welcome!' },
    members: 12, fee: 0
  },
  '2': {
    title: { KOR: '한강 피크닉 클럽', ENG: 'Han River Picnic Club' },
    tag: { KOR: '아웃도어', ENG: 'Outdoor' },
    emoji: '🌸',
    date: '2025년 5월 12일 오후 2시',
    loc: { KOR: '여의도 한강공원', ENG: 'Yeouido Han River Park' },
    desc: { KOR: '봄날 한강에서 함께 피크닉을 즐겨요. 돗자리와 간단한 먹거리를 준비해오세요.', ENG: 'Enjoy a spring picnic by the Han River. Bring a mat and snacks!' },
    members: 8, fee: 20
  },
  '3': {
    title: { KOR: '홍대 보드게임 나이트', ENG: 'Hongdae Board Game Night' },
    tag: { KOR: '게임', ENG: 'Games' },
    emoji: '🎲',
    date: '2025년 5월 14일 오후 7시',
    loc: { KOR: '마포구 홍대 보드게임 카페', ENG: 'Board Game Cafe, Hongdae' },
    desc: { KOR: '다양한 보드게임을 함께 즐기는 모임! 초보자도 환영합니다.', ENG: 'Fun board games for everyone. Beginners welcome!' },
    members: 6, fee: 10
  },
  '4': {
    title: { KOR: '강남 러닝 크루', ENG: 'Gangnam Running Crew' },
    tag: { KOR: '스포츠', ENG: 'Sports' },
    emoji: '🏃',
    date: '2025년 5월 15일 오전 7시',
    loc: { KOR: '강남구 양재천', ENG: 'Yangjae Stream, Gangnam-gu' },
    desc: { KOR: '매주 토요일 아침 가볍게 5km를 함께 뛰어요.', ENG: 'Every Saturday morning 5km run. All paces welcome!' },
    members: 20, fee: 0
  },
}

export default function MeetupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { lang } = useLang()
  const tx = t[lang]
  const router = useRouter()
  const m = data[id] ?? data['1']
  const [showModal, setShowModal] = useState(false)
  const [applied, setApplied] = useState(false)

  return (
    <div className="app-shell bg-gray-50 min-h-dvh pb-24">
      <div className="relative h-52 flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #B39DFA, #EDE9FE)' }}>
        <Link href="/meetups" className="absolute top-14 left-4 p-2 rounded-xl bg-white/70 backdrop-blur">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-8xl">{m.emoji}</span>
      </div>

      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{m.tag[lang]}</span>
          <h1 className="text-xl font-black text-gray-900 mt-2">{m.title[lang]}</h1>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={15} className="text-purple-400" />{m.date}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin size={15} className="text-purple-400" />{m.loc[lang]}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={15} className="text-purple-400" />{m.members}{tx.participants}
            </div>
          </div>
          <hr className="my-4 border-gray-100" />
          <p className="text-sm text-gray-600 leading-relaxed">{m.desc[lang]}</p>
          {m.fee > 0 && (
            <div className="mt-4 bg-purple-50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-purple-700">{tx.fee}</span>
              <span className="text-[14px] font-black text-purple-700">{m.fee} DORRI</span>
            </div>
          )}
        </div>

        {applied ? (
          <div className="mt-4 w-full py-4 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center justify-center gap-2">
            <Check size={18} className="text-green-600" />
            <span className="font-bold text-green-600">{tx.applied}</span>
          </div>
        ) : (
          <button onClick={() => setShowModal(true)}
            className="w-full mt-4 py-4 rounded-2xl font-bold text-white text-base shadow-lg"
            style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
            {tx.apply}
          </button>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[390px] bg-white rounded-t-3xl p-6 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h2 className="text-[18px] font-black text-[#232129] text-center">{tx.applyTitle}</h2>
            <p className="text-[13px] text-gray-500 text-center mt-1">{m.title[lang]}</p>
            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-[13px] text-gray-500 font-medium">{tx.fee}</span>
                <span className="text-[14px] font-black text-[#232129]">{m.fee > 0 ? `${m.fee} DORRI` : tx.free}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-[13px] text-gray-500 font-medium">{tx.date}</span>
                <span className="text-[13px] font-bold text-[#232129]">{m.date}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-[13px] text-gray-500 font-medium">{tx.location}</span>
                <span className="text-[13px] font-bold text-[#232129]">{m.loc[lang]}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-500 text-[14px]">
                {tx.cancel}
              </button>
              <button onClick={() => { setShowModal(false); router.push(`/meetups/${id}/apply-success`) }}
                className="flex-1 py-3.5 rounded-2xl font-bold text-white text-[14px]"
                style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
                {tx.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}