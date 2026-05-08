'use client'
import { useRouter } from 'next/navigation'
import { Check, Share2, Calendar, MapPin, Users, Wallet } from 'lucide-react'

export default function CreateSuccess() {
  const router = useRouter()

  return (
    <div className="app-shell bg-white min-h-dvh flex flex-col items-center px-5 pt-16 pb-10">
      {/* 성공 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <Check size={36} className="text-green-500" strokeWidth={3} />
      </div>

      <h1 className="text-[22px] font-black text-[#232129] text-center">밋업이 등록되었습니다!</h1>
      <p className="text-[13px] text-[#656070] mt-2 text-center">참가 신청이 들어오면 알려드릴게요</p>

      {/* 밋업 카드 */}
      <div className="w-full mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        {/* 커버 이미지 */}
        <div className="w-full h-[160px] bg-gradient-to-br from-purple-600 to-purple-900" />

        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-[17px] font-black text-[#232129]">Seoul Crypto Meetup</h2>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Calendar size={14} className="text-purple-400" />
            5/10 13:00 - 17:00PM | 홍대 크립토 라운지
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Wallet size={14} className="text-purple-400" />
            참가비: 30 DORRI
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Users size={14} className="text-purple-400" />
            정원: 0/20
          </div>
        </div>
      </div>

      {/* 버튼 */}
      <div className="w-full mt-auto pt-8 flex flex-col gap-3">
        <button
          onClick={() => router.push('/home')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          확인
        </button>
        <button className="w-full py-4 rounded-2xl font-bold text-[#7B5CF6] text-[15px] border-2 border-[#7B5CF6] flex items-center justify-center gap-2">
          <Share2 size={16} />
          공유하기
        </button>
      </div>
    </div>
  )
}