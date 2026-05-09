'use client'

import type { ReactNode } from 'react'
import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Check, MapPin, Users } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import {
  applyMeetup,
  closeOrganizerMeetup,
  getMe,
  getMeetup,
  getOrganizerApplications,
  refreshDorriBalance,
  settleApplication,
  updateOrganizerApplication,
  type MeetupDetail,
  type OrganizerApplication,
  type UserMe,
} from '@/lib/domain'

type OrganizerAction = 'approve' | 'reject' | 'check-in' | 'no-show'

export default function MeetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [me, setMe] = useState<UserMe | null>(null)
  const [applications, setApplications] = useState<OrganizerApplication[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')

  const isOrganizer = Boolean(me && meetup?.host.id === me.id)
  const applied = Boolean(meetup?.myApplication)
  const fee = Number(meetup?.lockedDorriAmount ?? 0)
  const canReview = meetup?.status === 'CLOSED' && meetup.myApplication?.status === 'CHECKED_IN'

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

  async function handleApply() {
    await run(async () => {
      await applyMeetup(id)
      setShowModal(false)
      await load()
    })
  }

  async function handleApplicationAction(applicationId: string, action: OrganizerAction) {
    await run(async () => {
      await updateOrganizerApplication(applicationId, action)

      if (action === 'no-show') {
        await settleApplication(applicationId)
        await refreshDorriBalance(2, 1000)
      }

      setApplications(await getOrganizerApplications(id))
    })
  }

  async function handleCloseMeetup() {
    await run(async () => {
      await closeOrganizerMeetup(id)
      await load()
    })
  }

  async function run(task: () => Promise<void>) {
    setError('')
    setIsBusy(true)
    try {
      await task()
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 처리에 실패했어요.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="app-shell min-h-dvh bg-gray-50 pb-24 md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      <div className="md:mx-auto md:grid md:max-w-6xl md:grid-cols-[440px_minmax(0,1fr)] md:gap-8">
        <div
          className="relative flex h-52 items-center justify-center md:h-[560px] md:rounded-[32px] md:shadow-[0_18px_48px_rgba(44,35,77,0.12)]"
          style={{ background: 'linear-gradient(160deg, #B39DFA, #EDE9FE)' }}
        >
          <Link href="/meetups" className="absolute left-4 top-4 rounded-xl bg-white/70 p-2 backdrop-blur md:left-6 md:top-6">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-8xl md:text-[140px]">{meetup?.type === 'PAID' ? 'P' : 'F'}</span>
        </div>

        <div className="mt-4 px-5 md:mt-0 md:px-0">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8 md:shadow-[0_18px_48px_rgba(44,35,77,0.08)]">
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-600 md:text-sm">
              {meetup?.status ?? 'Meetup'}
            </span>
            <h1 className="mt-2 text-xl font-black text-gray-900 md:mt-4 md:text-4xl">{meetup?.title ?? '밋업 정보를 불러오는 중'}</h1>
            <div className="mt-4 flex flex-col gap-3 md:mt-6 md:grid md:grid-cols-3 md:gap-4">
              <Info icon={<Calendar size={15} />} text={meetup ? new Date(meetup.startsAt).toLocaleString() : '-'} />
              <Info icon={<MapPin size={15} />} text={meetup?.location.name ?? '-'} />
              <Info icon={<Users size={15} />} text={`${meetup?.appliedCount ?? 0}명 참여 중`} />
            </div>
            <hr className="my-4 border-gray-100" />
            <p className="text-sm leading-relaxed text-gray-600 md:text-base">{meetup?.description ?? ''}</p>
            <div className="mt-4 rounded-xl bg-purple-50 p-3 md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-purple-700">{meetup?.type === 'FREE' ? '보증금' : '참가비'}</span>
                <span className="text-[14px] font-black text-purple-700">{fee > 0 ? `${fee} DORRI` : '무료'}</span>
              </div>
              <p className="mt-2 text-[11px] text-purple-500">주최자: {meetup?.host.name ?? '-'}</p>
            </div>
          </section>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-500">{error}</p>}

          {isOrganizer ? (
            <OrganizerPanel
              meetupId={id}
              applications={applications}
              meetupStatus={meetup?.status ?? ''}
              disabled={isBusy}
              onCloseMeetup={handleCloseMeetup}
              onAction={handleApplicationAction}
            />
          ) : applied ? (
            <ParticipantStatus meetupId={id} status={meetup?.myApplication?.status ?? ''} canReview={canReview} />
          ) : (
            <button
              onClick={() => setShowModal(true)}
              disabled={meetup?.status !== 'PUBLISHED'}
              className="mt-4 w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:bg-gray-300 md:h-14"
              style={meetup?.status === 'PUBLISHED' ? { background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' } : undefined}
            >
              참가 신청하기
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[390px] rounded-t-3xl bg-white p-6 pb-24 md:max-w-[520px] md:rounded-3xl md:pb-6">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-gray-200" />
            <h2 className="text-center text-[18px] font-black text-[#232129]">참가 신청</h2>
            <p className="mt-1 text-center text-[13px] text-gray-500">{meetup?.title}</p>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
              <span className="text-[13px] font-medium text-gray-500">{meetup?.type === 'FREE' ? '보증금' : '참가비'}</span>
              <span className="text-[14px] font-black text-[#232129]">{fee > 0 ? `${fee} DORRI` : '무료'}</span>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-2xl border-2 border-gray-200 py-3.5 text-[14px] font-bold text-gray-500">
                취소
              </button>
              <button onClick={handleApply} disabled={isBusy} className="flex-1 rounded-2xl bg-[#6D28D9] py-3.5 text-[14px] font-bold text-white disabled:opacity-50">
                {isBusy ? '처리 중' : '신청 확인'}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  )
}

function Info({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-2 text-sm text-gray-500"><span className="text-purple-400">{icon}</span>{text}</div>
}

function ParticipantStatus({ meetupId, status, canReview }: { meetupId: string; status: string; canReview: boolean }) {
  return (
    <div className="mt-4 rounded-2xl border-2 border-green-200 bg-green-50 p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <Check size={18} className="text-green-600" />
        <span className="font-bold text-green-600">참가 상태: {status}</span>
      </div>
      {canReview && (
        <Link href={`/meetups/${meetupId}/review`} className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#6D28D9] px-6 text-sm font-bold text-white">
          리뷰 작성하기
        </Link>
      )}
    </div>
  )
}

function OrganizerPanel({ meetupId, applications, meetupStatus, disabled, onCloseMeetup, onAction }: {
  meetupId: string
  applications: OrganizerApplication[]
  meetupStatus: string
  disabled: boolean
  onCloseMeetup: () => void
  onAction: (applicationId: string, action: OrganizerAction) => void
}) {
  const isClosed = meetupStatus === 'CLOSED'

  return (
    <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#232129]">주최자 관리</h2>
          <p className="mt-1 text-xs text-gray-500">
            종료 전에는 신청 수락/거절만, 종료 후에는 수락된 유저의 체크인/노쇼만 처리해요.
          </p>
        </div>
        <button onClick={onCloseMeetup} disabled={disabled || isClosed} className="rounded-2xl bg-[#6D28D9] px-5 py-3 text-sm font-bold text-white disabled:bg-gray-300">
          {isClosed ? '종료됨' : '밋업 종료'}
        </button>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {applications.map((application) => (
            <OrganizerApplicationCard
            meetupId={meetupId}
            key={application.id}
            application={application}
            isClosed={isClosed}
            disabled={disabled}
            onAction={onAction}
          />
        ))}
        {applications.length === 0 && <p className="rounded-2xl border border-gray-100 p-8 text-center text-sm font-semibold text-gray-400">아직 참가 신청자가 없어요.</p>}
      </div>
    </section>
  )
}

function OrganizerApplicationCard({ meetupId, application, isClosed, disabled, onAction }: {
  meetupId: string
  application: OrganizerApplication
  isClosed: boolean
  disabled: boolean
  onAction: (applicationId: string, action: OrganizerAction) => void
}) {
  const isPending = application.status === 'PENDING_APPROVAL'
  const isApproved = application.status === 'APPROVED'
  const isCheckedIn = application.status === 'CHECKED_IN'
  const isNoShow = application.status === 'NO_SHOW' || application.status === 'SETTLED'

  return (
    <div className="rounded-2xl border border-gray-100 bg-[#FBFAFF] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#232129]">{application.participant.name}</p>
          <p className="mt-1 text-xs text-gray-500">신뢰 별점 {application.participant.reputationScore} · {application.lockedDorriAmount} DORRI</p>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600">{application.status}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!isClosed && isPending && (
          <>
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'approve')} label="수락" />
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'reject')} label="거절/정산" />
          </>
        )}
        {!isClosed && isApproved && (
          <>
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'check-in')} label="체크인" />
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'no-show')} label="노쇼/정산" />
          </>
        )}
        {!isClosed && isCheckedIn && <p className="text-xs font-semibold text-green-600">체크인 완료. 밋업 종료 후 참가자가 리뷰를 작성할 수 있어요.</p>}
        {isClosed && isCheckedIn && <Link href={`/meetups/${meetupId}/review`} className="text-xs font-bold text-purple-600">참가자 리뷰/블락하기</Link>}
        {!isClosed && isNoShow && <p className="text-xs font-semibold text-gray-500">노쇼 처리 및 정산 플로우가 진행된 상태입니다.</p>}
        {isClosed && isNoShow && <p className="text-xs font-semibold text-gray-500">노쇼 처리 및 정산 완료 대상입니다.</p>}
        {!isPending && !isApproved && !isCheckedIn && !isNoShow && <p className="text-xs font-semibold text-gray-500">처리 완료된 신청입니다.</p>}
      </div>
    </div>
  )
}

function ActionButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button disabled={disabled} onClick={onClick} className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-xs font-bold text-purple-600 disabled:bg-gray-50 disabled:text-gray-300">{label}</button>
}
