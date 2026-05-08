'use client'
import { useRouter } from 'next/navigation'
import { Check, Calendar, MapPin, Users, Wallet } from 'lucide-react'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    title: '참여 신청 완료!',
    subtitle: '밋업 참여 신청이 완료되었어요.\n호스트 승인 후 확정됩니다.',
    meetupTitle: '서울 언어교환 모임',
    date: '2025년 5월 10일 오후 3시',
    location: '마포구 홍대입구역 근처',
    participants: '12명 참여 중',
    fee: '참가비: 무료',
    escrow: '참가비는 에스크로로 안전하게 보관되며, 밋업 종료 후 정산됩니다.',
    home: '홈으로',
    explore: '밋업 더 둘러보기',
  },
  ENG: {
    title: 'Application Complete!',
    subtitle: 'Your meetup application has been submitted.\nWaiting for host approval.',
    meetupTitle: 'Seoul Language Exchange',
    date: 'May 10, 2025 3:00 PM',
    location: 'Near Hongdae Station, Mapo-gu',
    participants: '12 participants',
    fee: 'Entry Fee: Free',
    escrow: 'Entry fee is securely held in escrow and settled after the meetup ends.',
    home: 'Go to Home',
    explore: 'Explore More Meetups',
  }
}

export default function ApplySuccess() {
  const router = useRouter()
  const { lang } = useLang()
  const tx = t[lang]

  return (
    <div className="app-shell bg-white min-h-dvh flex flex-col items-center px-5 pt-16 pb-10">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <Check size={36} className="text-green-500" strokeWidth={3} />
      </div>

      <h1 className="text-[22px] font-black text-[#232129] text-center">{tx.title}</h1>
      <p className="text-[13px] text-[#656070] mt-2 text-center leading-relaxed whitespace-pre-line">{tx.subtitle}</p>

      <div className="w-full mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="w-full h-[140px] flex items-center justify-center text-6xl"
          style={{ background: 'linear-gradient(160deg, #B39DFA, #EDE9FE)' }}>
          🗣️
        </div>
        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-[17px] font-black text-[#232129]">{tx.meetupTitle}</h2>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Calendar size={14} className="text-purple-400" />{tx.date}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <MapPin size={14} className="text-purple-400" />{tx.location}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Users size={14} className="text-purple-400" />{tx.participants}
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Wallet size={14} className="text-purple-400" />{tx.fee}
          </div>
        </div>
      </div>

      <div className="w-full mt-4 bg-purple-50 rounded-2xl p-4">
        <p className="text-[12px] text-[#656070] leading-relaxed text-center">
          {tx.escrow}
        </p>
      </div>

      <div className="w-full mt-auto pt-8 flex flex-col gap-3">
        <button onClick={() => router.push('/home')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          {tx.home}
        </button>
        <button onClick={() => router.push('/meetups')}
          className="w-full py-4 rounded-2xl font-bold text-[#7B5CF6] text-[15px] border-2 border-[#7B5CF6]">
          {tx.explore}
        </button>
      </div>
    </div>
  )
}