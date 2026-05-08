'use client'
import { useRouter } from 'next/navigation'
import { Check, Calendar, MapPin, Users, Wallet } from 'lucide-react'

export default function ApplySuccess() {
  const router = useRouter()

  return (
    <div className="app-shell bg-white min-h-dvh flex flex-col items-center px-5 pt-16 pb-10">
      {/* 성공 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <Check size={36} className="text-green-500" strokeWidth={3} />
      </div>

      <h1 className="text-[22px] font-black text-[#232129] text-center">참여 신청 완료!</h1>
      <p className="text-[13px] text-[#656070] mt-2 text-center leading-relaxed">
        밋업 참여 신청이 완료되었어요.<br />호스트 승인 후 확정됩니다.
      </p>

      {/* 밋업 카드 */}
      <div className="w-full mt-8 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="w-full h-[140px] flex items-center justify-center text-6xl"
          style={{ background: 'linear-gradient(160deg, #B39DFA, #EDE9FE)' }}>
          🗣️
        </div>
        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-[17px] font-black text-[#232129]">서울 언어교환 모임</h2>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Calendar size={14} className="text-purple-400" />
            2025년 5월 10일 오후 3시
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <MapPin size={14} className="text-purple-400" />
            마포구 홍대입구역 근처
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Users size={14} className="text-purple-400" />
            12명 참여 중
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#656070]">
            <Wallet size={14} className="text-purple-400" />
            참가비: 무료
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="w-full mt-4 bg-purple-50 rounded-2xl p-4">
        <p className="text-[12px] text-[#656070] leading-relaxed text-center">
          참가비는 <span className="text-purple-600 font-semibold">에스크로</span>로 안전하게 보관되며,<br />
          밋업 종료 후 정산됩니다.
        </p>
      </div>

      {/* 버튼 */}
      <div className="w-full mt-auto pt-8 flex flex-col gap-3">
        <button
          onClick={() => router.push('/home')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          홈으로
        </button>
        <button
          onClick={() => router.push('/meetups')}
          className="w-full py-4 rounded-2xl font-bold text-[#7B5CF6] text-[15px] border-2 border-[#7B5CF6]">
          밋업 더 둘러보기
        </button>
      </div>
    </div>
  )
}