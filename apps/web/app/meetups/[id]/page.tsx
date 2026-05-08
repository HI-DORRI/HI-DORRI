'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Calendar, Clock, MapPin, Users, MoreVertical } from 'lucide-react'

export default function CreateMeetup() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState(0)
  const [type, setType] = useState<'free' | 'paid'>('free')
  const [fee, setFee] = useState(0)

  const isReady = title && date && startTime && endTime && location && capacity > 0

  return (
    <div className="app-shell bg-white min-h-dvh pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[16px] font-black text-[#232129]">밋업 만들기</h1>
        <button className="p-2 -mr-2">
          <MoreVertical size={20} />
        </button>
      </div>

      {/* 커버 사진 */}
      <div className="mx-5 mt-5 h-[160px] rounded-2xl bg-gray-200 flex items-center justify-center">
        <button className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-[13px] font-semibold text-gray-700">
          <Camera size={16} />
          커버 사진 변경
        </button>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-5">
        {/* 밋업 제목 */}
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">밋업 제목</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="입력하세요.."
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition"
          />
        </div>

        {/* 주최자 */}
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">주최자</label>
          <input
            value="CryptoMagic"
            readOnly
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] bg-gray-50 text-gray-500"
          />
        </div>

        {/* 날짜 */}
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">날짜</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition"
            />
          </div>
        </div>

        {/* 시간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-bold text-[#232129] mb-2 block">시작 시간</label>
            <div className="relative">
              <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="text-[13px] font-bold text-[#232129] mb-2 block">종료 시간</label>
            <div className="relative">
              <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>
        </div>

        {/* 장소 */}
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">장소</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="입력하세요..."
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition"
            />
          </div>
        </div>

        {/* 정원 */}
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">정원</label>
          <div className="relative">
            <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              value={capacity || ''}
              onChange={e => setCapacity(Number(e.target.value))}
              placeholder="0"
              min={1}
              className="w-full pl-10 pr-16 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 font-medium">명</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* 밋업 유형 */}
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-3 block">밋업 유형</label>
          <div className="grid grid-cols-2 rounded-xl overflow-hidden border border-gray-200">
            <button
              onClick={() => setType('free')}
              className={`py-3 text-[14px] font-bold transition ${type === 'free' ? 'bg-[#7B5CF6] text-white' : 'bg-white text-gray-500'}`}>
              무료
            </button>
            <button
              onClick={() => setType('paid')}
              className={`py-3 text-[14px] font-bold transition ${type === 'paid' ? 'bg-[#7B5CF6] text-white' : 'bg-white text-gray-500'}`}>
              유료
            </button>
          </div>
        </div>

        {/* 보증금 / 참가비 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[13px] font-bold text-[#232129] mb-2 block">보증금</label>
            <div className="px-4 py-3.5 rounded-xl border border-gray-200 flex items-center justify-end">
              <span className="text-[14px] font-black text-[#7B5CF6]">200</span>
              <span className="text-[12px] text-gray-400 ml-1">DORRI</span>
            </div>
          </div>
          <div>
            <label className="text-[13px] font-bold text-[#232129] mb-2 block">참가비</label>
            <div className="relative">
              <input
                type="number"
                value={fee || ''}
                onChange={e => setFee(Number(e.target.value))}
                placeholder="0"
                disabled={type === 'free'}
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] text-right font-black text-[#7B5CF6] outline-none focus:border-purple-400 disabled:bg-gray-50 disabled:text-gray-400 transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">DORRI</span>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="flex items-start gap-2 bg-purple-50 rounded-xl p-4">
          <span className="text-purple-400 mt-0.5 text-[14px]">ℹ️</span>
          <p className="text-[12px] text-[#656070] leading-relaxed">
            호스트 보증금과 참가비는 <span className="text-purple-600 font-semibold">에스크로</span>로 안전하게 보관되며, 밋업 종료 후 정산됩니다.
          </p>
        </div>

        {/* 등록 버튼 */}
        <button
          disabled={!isReady}
          onClick={() => router.push('/meetups/create/success')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px] transition disabled:opacity-40"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          등록하기
        </button>
      </div>
    </div>
  )
}