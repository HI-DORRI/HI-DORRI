'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Calendar, Clock, MapPin, MoreVertical, Users } from 'lucide-react'
import { createMeetup, getMe, type UserMe } from '@/lib/domain'

export default function CreateMeetup() {
  const router = useRouter()
  const [me, setMe] = useState<UserMe | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState(0)
  const [type, setType] = useState<'free' | 'paid'>('free')
  const [fee, setFee] = useState(0)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    getMe().then(setMe).catch(() => setMe(null))
  }, [])

  const isReady = title && date && startTime && endTime && location && capacity > 0 && (type === 'free' || fee > 0)

  async function handleSubmit() {
    if (!isReady || isSubmitting) return
    setError('')
    setIsSubmitting(true)

    try {
      const meetup = await createMeetup({
        title,
        description: description || `${title} 밋업입니다.`,
        locationName: location,
        address: location,
        startsAt: new Date(`${date}T${startTime}`).toISOString(),
        endsAt: new Date(`${date}T${endTime}`).toISOString(),
        type: type === 'free' ? 'FREE' : 'PAID',
        depositDorri: type === 'free' ? '20' : '0',
        entryFeeDorri: type === 'paid' ? String(fee) : '0',
        capacity,
        tags: [],
      })
      router.push(`/meetups/${meetup.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : '밋업 등록에 실패했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell min-h-dvh bg-white pb-10 md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:py-12">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-4 pt-12 md:mx-auto md:max-w-5xl md:rounded-t-[32px] md:border-none md:bg-white md:px-8 md:pt-8">
        <button onClick={() => router.back()} className="p-2 -ml-2"><ArrowLeft size={20} /></button>
        <h1 className="text-[16px] font-black text-[#232129]">밋업 만들기</h1>
        <button className="p-2 -mr-2"><MoreVertical size={20} /></button>
      </div>

      <div className="mx-5 mt-5 flex h-[160px] items-center justify-center rounded-2xl bg-[#EDE9FE] md:mx-auto md:mt-0 md:h-64 md:max-w-5xl md:rounded-none">
        <button className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold text-gray-700">
          <Camera size={16} />커버 사진 변경
        </button>
      </div>

      <div className="mx-5 mt-6 flex flex-col gap-5 md:mx-auto md:mt-0 md:grid md:max-w-5xl md:grid-cols-2 md:gap-6 md:rounded-b-[32px] md:bg-white md:p-8 md:shadow-[0_18px_48px_rgba(44,35,77,0.08)]">
        <Field className="md:col-span-2" label="밋업 제목">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="입력하세요."
            className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[14px] outline-none focus:border-purple-400" />
        </Field>

        <Field className="md:col-span-2" label="밋업 설명">
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="밋업을 소개해 주세요."
            className="min-h-24 w-full resize-none rounded-xl border border-gray-200 px-4 py-3.5 text-[14px] outline-none focus:border-purple-400" />
        </Field>

        <Field className="md:col-span-2" label="주최자">
          <input value={me?.name ?? '현재 사용자'} readOnly
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[14px] text-gray-500" />
        </Field>

        <Field className="md:col-span-2" label="날짜">
          <IconInput icon={<Calendar size={16} />}>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-4 text-[14px] outline-none focus:border-purple-400" />
          </IconInput>
        </Field>

        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <Field label="시작 시간">
            <IconInput icon={<Clock size={16} />}>
              <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-4 text-[14px] outline-none focus:border-purple-400" />
            </IconInput>
          </Field>
          <Field label="종료 시간">
            <IconInput icon={<Clock size={16} />}>
              <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-4 text-[14px] outline-none focus:border-purple-400" />
            </IconInput>
          </Field>
        </div>

        <Field label="장소">
          <IconInput icon={<MapPin size={16} />}>
            <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="입력하세요."
              className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-4 text-[14px] outline-none focus:border-purple-400" />
          </IconInput>
        </Field>

        <Field label="정원">
          <IconInput icon={<Users size={16} />}>
            <input type="number" min={1} value={capacity || ''} onChange={(event) => setCapacity(Number(event.target.value))}
              placeholder="0" className="w-full rounded-xl border border-gray-200 py-3.5 pl-10 pr-12 text-[14px] outline-none focus:border-purple-400" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">명</span>
          </IconInput>
        </Field>

        <hr className="border-gray-100 md:col-span-2" />

        <Field className="md:col-span-2" label="밋업 유형">
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-gray-200">
            <button onClick={() => setType('free')} className={`py-3 text-[14px] font-bold ${type === 'free' ? 'bg-[#7B5CF6] text-white' : 'bg-white text-gray-500'}`}>무료</button>
            <button onClick={() => setType('paid')} className={`py-3 text-[14px] font-bold ${type === 'paid' ? 'bg-[#7B5CF6] text-white' : 'bg-white text-gray-500'}`}>유료</button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <Field label="보증금">
            <div className={`flex rounded-xl border border-gray-200 px-4 py-3.5 ${type === 'paid' ? 'justify-center bg-gray-50 text-gray-400' : 'justify-end'}`}>
              {type === 'paid' ? (
                <span className="text-[13px] font-bold">보증금 없음</span>
              ) : (
                <>
                  <span className="text-[14px] font-black text-[#7B5CF6]">20</span>
                  <span className="ml-1 text-[12px] text-gray-400">DORRI</span>
                </>
              )}
            </div>
          </Field>
          <Field label="참가비">
            <div className="relative">
              <input type="number" min={0} value={fee || ''} onChange={(event) => setFee(Number(event.target.value))}
                placeholder="0" disabled={type === 'free'}
                className="w-full rounded-xl border border-gray-200 py-3.5 pl-4 pr-20 text-right text-[14px] font-black text-[#7B5CF6] outline-none disabled:bg-gray-50 disabled:text-gray-400" />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-gray-400">DORRI</span>
            </div>
          </Field>
        </div>

        <div className="rounded-xl bg-purple-50 p-4 text-[12px] leading-relaxed text-[#656070] md:col-span-2">
          무료 밋업은 20 DORRI 보증금이 잠기고, 유료 밋업은 보증금 없이 참가비만 적용됩니다.
        </div>

        {error && <p className="rounded-xl bg-red-50 p-4 text-[12px] font-semibold text-red-500 md:col-span-2">{error}</p>}

        <button disabled={!isReady || isSubmitting} onClick={handleSubmit}
          className="w-full rounded-2xl py-4 text-[15px] font-bold text-white disabled:opacity-40 md:col-span-2 md:mx-auto md:h-14 md:max-w-md"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          {isSubmitting ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[13px] font-bold text-[#232129]">{label}</label>
      {children}
    </div>
  )
}

function IconInput({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      {children}
    </div>
  )
}
