'use client'

import type { ReactNode } from 'react'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical, Search, Star, X } from 'lucide-react'
import {
  createApplicationReview,
  evaluateOrganizerParticipant,
  getMe,
  getMeetup,
  getOrganizerApplications,
  refreshDorriBalance,
  settleApplication,
  type MeetupDetail,
  type OrganizerApplication,
  type UserMe,
} from '@/lib/domain'

const reviewableStatuses = ['CHECKED_IN', 'NO_SHOW', 'REVIEWED', 'SETTLED']
const attendedStatuses = ['CHECKED_IN', 'REVIEWED', 'SETTLED']

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [me, setMe] = useState<UserMe | null>(null)
  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [applications, setApplications] = useState<OrganizerApplication[]>([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [bulkRating, setBulkRating] = useState(0)
  const [participantRatings, setParticipantRatings] = useState<Record<string, number>>({})
  const [blocked, setBlocked] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOrganizer = Boolean(me && meetup?.host.id === me.id)
  const reviewableApplications = useMemo(
    () => applications.filter((item) => reviewableStatuses.includes(item.status)),
    [applications],
  )
  const filteredApplications = reviewableApplications.filter((item) =>
    item.participant.name.toLowerCase().includes(search.toLowerCase()),
  )

  const load = useCallback(async () => {
    const [meetupData, meData] = await Promise.all([getMeetup(id), getMe()])
    setMeetup(meetupData)
    setMe(meData)

    if (meetupData.host.id === meData.id) {
      setApplications(await getOrganizerApplications(id))
    }
  }, [id])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      load().catch(() => undefined)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [load])

  async function submitParticipantReview() {
    if (!meetup?.myApplication) return
    const applicationId = meetup.myApplication.id

    if (meetup.myApplication.status !== 'REVIEWED' && rating === 0) return

    setError('')
    setNotice('')
    setIsSubmitting(true)

    try {
      if (meetup.myApplication.status !== 'REVIEWED') {
        await createApplicationReview(applicationId, { rating, tags: [], comment })
      }

      await settleApplication(applicationId)
      await refreshDorriBalance(3, 1000)
      router.push('/home')
    } catch (err) {
      setNotice('리뷰는 저장됐어요. XRPL 정산이 실패해서 아래 버튼으로 다시 시도해 주세요.')
      setError(err instanceof Error ? err.message : '정산에 실패했어요.')
      await load().catch(() => undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function retryParticipantSettlement() {
    if (!meetup?.myApplication) return
    setError('')
    setIsSubmitting(true)

    try {
      await settleApplication(meetup.myApplication.id)
      await refreshDorriBalance(3, 1000)
      router.push('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : '정산 재시도에 실패했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function applyBulkRating(value: number) {
    setBulkRating(value)
    setParticipantRatings((prev) => {
      const next = { ...prev }
      reviewableApplications
        .filter((item) => !item.organizerEvaluation && attendedStatuses.includes(item.status))
        .forEach((item) => {
          next[item.id] = value
        })
      return next
    })
  }

  async function submitOrganizerReviews() {
    setError('')
    setIsSubmitting(true)

    try {
      const targets = reviewableApplications.filter(
        (item) => !item.organizerEvaluation && (participantRatings[item.id] || blocked[item.id]),
      )
      await Promise.all(
        targets.map((item) =>
          evaluateOrganizerParticipant(item.id, {
            rating: participantRatings[item.id] || 1,
            tags: [],
            blocked: Boolean(blocked[item.id]),
            blockReason: blocked[item.id] ? 'Organizer blocked this participant after meetup.' : undefined,
          }),
        ),
      )
      router.push(`/meetups/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '참가자 평가 제출에 실패했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell min-h-dvh bg-white pb-24 md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      <div className="mx-auto max-w-6xl md:rounded-[32px] md:bg-white md:shadow-[0_18px_48px_rgba(44,35,77,0.08)]">
        <Header title={isOrganizer ? '참가자 평가' : '밋업 리뷰'} onBack={() => router.back()} />

        <main className="px-5 py-6 md:px-8 md:py-8">
          {isOrganizer ? (
            <OrganizerReviewPanel
              applications={filteredApplications}
              totalCount={reviewableApplications.length}
              search={search}
              bulkRating={bulkRating}
              ratings={participantRatings}
              blocked={blocked}
              onSearch={setSearch}
              onBulkRate={applyBulkRating}
              onRate={(applicationId, value) => setParticipantRatings((prev) => ({ ...prev, [applicationId]: value }))}
              onToggleBlock={(applicationId) => setBlocked((prev) => ({ ...prev, [applicationId]: !prev[applicationId] }))}
            />
          ) : (
            <ParticipantReviewPanel
              meetup={meetup}
              rating={rating}
              comment={comment}
              reviewed={meetup?.myApplication?.status === 'REVIEWED'}
              onRate={setRating}
              onComment={setComment}
            />
          )}

          {notice && <p className="mt-5 rounded-xl bg-purple-50 px-4 py-3 text-[13px] font-semibold text-purple-600">{notice}</p>}
          {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-500">{error}</p>}

          <div className="mt-8 flex flex-col gap-3 md:mx-auto md:max-w-md">
            <button
              disabled={isSubmitting || (isOrganizer ? reviewableApplications.length === 0 : meetup?.myApplication?.status !== 'REVIEWED' && rating === 0)}
              onClick={isOrganizer ? submitOrganizerReviews : submitParticipantReview}
              className="h-14 w-full rounded-2xl bg-[#6D28D9] text-[15px] font-bold text-white disabled:bg-gray-300"
            >
              {isSubmitting ? '처리 중' : isOrganizer ? '평가 완료 및 제출' : meetup?.myApplication?.status === 'REVIEWED' ? '정산 다시 시도' : '리뷰 제출하고 정산받기'}
            </button>
            {!isOrganizer && meetup?.myApplication?.status === 'REVIEWED' && (
              <button onClick={retryParticipantSettlement} disabled={isSubmitting} className="h-12 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 disabled:opacity-40">
                정산만 다시 시도하기
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-gray-100 px-5 pb-4 pt-12 md:px-8 md:pt-8">
      <button onClick={onBack} className="p-2 -ml-2"><ArrowLeft size={20} /></button>
      <h1 className="text-[16px] font-black text-[#232129]">{title}</h1>
      <button className="p-2 -mr-2"><MoreVertical size={18} /></button>
    </header>
  )
}

function ParticipantReviewPanel({ meetup, rating, comment, reviewed, onRate, onComment }: {
  meetup: MeetupDetail | null
  rating: number
  comment: string
  reviewed: boolean
  onRate: (rating: number) => void
  onComment: (comment: string) => void
}) {
  return (
    <section>
      <div className="rounded-2xl bg-[#F8F6FF] p-5 text-center">
        <p className="text-sm font-bold text-purple-600">{meetup?.title ?? '밋업'}</p>
        <h2 className="mt-2 text-xl font-black text-[#232129]">{reviewed ? '리뷰가 저장됐어요' : '밋업은 어땠나요?'}</h2>
        <p className="mt-1 text-xs text-gray-500">
          {reviewed ? '정산이 실패했다면 다시 시도할 수 있어요.' : '체크인된 참가자만 리뷰를 남기고 정산을 받을 수 있어요.'}
        </p>
        {!reviewed && (
          <div className="mt-5 flex justify-center">
            <StarRating value={rating} onChange={onRate} size={36} />
          </div>
        )}
      </div>

      {!reviewed && (
        <>
          <label className="mt-6 block text-[13px] font-bold text-[#232129]">후기</label>
          <textarea
            value={comment}
            onChange={(event) => onComment(event.target.value)}
            placeholder="밋업 경험을 간단히 남겨주세요."
            rows={6}
            className="mt-2 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-[13px] outline-none transition focus:border-purple-400"
          />
        </>
      )}
    </section>
  )
}

function OrganizerReviewPanel(props: {
  applications: OrganizerApplication[]
  totalCount: number
  search: string
  bulkRating: number
  ratings: Record<string, number>
  blocked: Record<string, boolean>
  onSearch: (value: string) => void
  onBulkRate: (value: number) => void
  onRate: (applicationId: string, rating: number) => void
  onToggleBlock: (applicationId: string) => void
}) {
  return (
    <section>
      <div className="rounded-2xl bg-[#F8F6FF] p-5 text-center">
        <h2 className="text-xl font-black text-[#232129]">일괄 평가</h2>
        <p className="mt-1 text-xs text-gray-500">체크인 참가자에게만 기본 평점을 부여해요. 노쇼 유저는 제외됩니다.</p>
        <div className="mt-5 flex justify-center">
          <StarRating value={props.bulkRating} onChange={props.onBulkRate} size={32} />
        </div>
      </div>

      <div className="relative mt-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={props.search}
          onChange={(event) => props.onSearch(event.target.value)}
          placeholder="참가자 검색..."
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-[13px] outline-none transition focus:border-purple-400"
        />
      </div>

      <p className="mb-3 mt-5 text-[14px] font-black text-[#232129]">참가자 명단 ({props.totalCount}명)</p>
      <div className="flex flex-col gap-2">
        {props.applications.map((application) => (
          <OrganizerReviewRow
            key={application.id}
            application={application}
            rating={props.ratings[application.id] ?? 0}
            blocked={Boolean(props.blocked[application.id])}
            onRate={(value) => props.onRate(application.id, value)}
            onToggleBlock={() => props.onToggleBlock(application.id)}
          />
        ))}
        {props.applications.length === 0 && <p className="rounded-2xl border border-gray-100 p-8 text-center text-sm font-semibold text-gray-400">평가할 참가자가 없어요.</p>}
      </div>
    </section>
  )
}

function OrganizerReviewRow({ application, rating, blocked, onRate, onToggleBlock }: {
  application: OrganizerApplication
  rating: number
  blocked: boolean
  onRate: (rating: number) => void
  onToggleBlock: () => void
}) {
  const isNoShow = application.status === 'NO_SHOW'
  const evaluated = Boolean(application.organizerEvaluation)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
      <Avatar>{application.participant.name[0]}</Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#232129]">{application.participant.name}</p>
        <p className={`mt-0.5 text-[11px] ${isNoShow ? 'text-red-400' : 'text-gray-400'}`}>{isNoShow ? '노쇼' : '참가 완료'}</p>
      </div>
      {evaluated ? (
        <span className="rounded-full bg-green-50 px-3 py-2 text-[11px] font-bold text-green-600">평가 완료</span>
      ) : (
        <>
      <div className="hidden md:block">
        <StarRating value={rating} onChange={onRate} size={15} />
      </div>
      <button className="rounded-lg bg-purple-50 px-3 py-2 text-[11px] font-bold text-purple-600 md:hidden" onClick={() => onRate(rating >= 5 ? 1 : rating + 1)}>
        {rating || '평가'}
      </button>
      <button onClick={onToggleBlock} className={`flex h-8 w-8 items-center justify-center rounded-full ${blocked ? 'bg-red-50 text-red-400' : 'bg-gray-100 text-gray-400'}`}>
        <X size={13} />
      </button>
        </>
      )}
    </div>
  )
}

function Avatar({ children }: { children: ReactNode }) {
  return <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-base font-black text-purple-400">{children}</div>
}

function StarRating({ value, onChange, size = 20 }: { value: number; onChange: (value: number) => void; size?: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((item) => (
        <button key={item} onClick={() => onChange(item)} type="button">
          <Star size={size} fill={item <= value ? '#F59E0B' : 'none'} className={item <= value ? 'text-yellow-400' : 'text-gray-300'} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}
