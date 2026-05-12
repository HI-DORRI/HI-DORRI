'use client'

import type { ReactNode } from 'react'
import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Check, MapPin, Users } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { useLang } from '@/components/LangContext'
import {
  applyMeetup,
  cancelApplication,
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
type Lang = 'KOR' | 'ENG'
const organizerReviewSettlementReasons = ['FREE_ATTENDED', 'FREE_NO_SHOW', 'PAID_ATTENDED', 'PAID_NO_SHOW']

const copy = {
  KOR: {
    loading: '밋업 정보를 불러오는 중',
    peopleJoined: '명 참여 중',
    deposit: '보증금',
    fee: '참가비',
    free: '무료',
    host: '주최자',
    apply: '참가 신청하기',
    applyTitle: '참가 신청',
    cancel: '취소',
    confirm: '신청 확인',
    processing: '처리 중',
    participantStatus: '참가상태',
    writeReview: '리뷰 작성하기',
    organizerPanel: '주최자 관리',
    organizerHelp: '신청 수락/거절 후 밋업 진행 중 체크인/노쇼를 처리하고, 종료 후 참가자를 한 번에 리뷰/블락할 수 있어요.',
    closeMeetup: '밋업 종료',
    closed: '종료됨',
    reviewParticipants: '밋업 참가자 리뷰/블락하기',
    noApplications: '아직 참가 신청자가 없어요.',
    reputation: '신뢰 별점',
    approve: '수락',
    reject: '거절/정산',
    checkIn: '체크인',
    noShow: '노쇼/정산',
    checkedInDone: '체크인 완료. 밋업 종료 후 참가자가 리뷰를 작성할 수 있어요.',
    noShowDone: '노쇼 처리 및 정산 플로우가 진행된 상태입니다.',
    noShowSettled: '노쇼 처리 및 정산 완료 대상입니다.',
    attendedSettled: '참가 완료 및 정산 완료 대상입니다.',
    completed: '처리 완료된 신청입니다.',
    requestFailed: '요청 처리에 실패했어요.',
  },
  ENG: {
    loading: 'Loading meetup details',
    peopleJoined: ' joined',
    deposit: 'Deposit',
    fee: 'Entry Fee',
    free: 'Free',
    host: 'Host',
    apply: 'Apply to Join',
    applyTitle: 'Apply to Join',
    cancel: 'Cancel',
    confirm: 'Confirm',
    processing: 'Processing',
    participantStatus: 'Status',
    writeReview: 'Write Review',
    organizerPanel: 'Organizer Panel',
    organizerHelp: 'Approve or reject requests, mark check-in/no-show during the meetup, then review or block participants after closing.',
    closeMeetup: 'Close Meetup',
    closed: 'Closed',
    reviewParticipants: 'Review / Block Participants',
    noApplications: 'No applications yet.',
    reputation: 'Trust score',
    approve: 'Approve',
    reject: 'Reject / Settle',
    checkIn: 'Check in',
    noShow: 'No-show / Settle',
    checkedInDone: 'Checked in. Participants can write reviews after the meetup closes.',
    noShowDone: 'No-show settlement is in progress.',
    noShowSettled: 'No-show settlement completed.',
    attendedSettled: 'Attendance settlement completed.',
    completed: 'This application has been processed.',
    requestFailed: 'Request failed.',
  },
}

const statusLabels = {
  KOR: {
    PENDING_APPROVAL: '신청 완료',
    APPROVED: '수락됨',
    REJECTED: '거절됨',
    CHECKED_IN: '체크인 완료',
    NO_SHOW: '노쇼',
    REVIEWED: '리뷰 완료',
    SETTLED: '정산완료',
  },
  ENG: {
    PENDING_APPROVAL: 'Applied',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CHECKED_IN: 'Checked in',
    NO_SHOW: 'No-show',
    REVIEWED: 'Reviewed',
    SETTLED: 'Settled',
  },
}

export default function MeetupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { lang } = useLang()
  const tx = copy[lang]
  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [me, setMe] = useState<UserMe | null>(null)
  const [applications, setApplications] = useState<OrganizerApplication[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
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

  async function handleCancelApplication() {
    if (!meetup?.myApplication) return

    await run(async () => {
      await cancelApplication(meetup.myApplication!.id)
      await refreshDorriBalance(3, 1000)
      await load()
    })
  }

  function requestCancelApplication() {
    setShowCancelModal(true)
  }

  async function confirmCancelApplication() {
    setShowCancelModal(false)
    await handleCancelApplication()
  }

  async function run(task: () => Promise<void>) {
    setError('')
    setIsBusy(true)
    try {
      await task()
    } catch (err) {
      setError(err instanceof Error ? err.message : tx.requestFailed)
    } finally {
      setIsBusy(false)
    }
  }

  if (!meetup || !me) {
    return <MeetupDetailSkeleton />
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
              {meetup.status}
            </span>
            <h1 className="mt-2 text-xl font-black text-gray-900 md:mt-4 md:text-4xl">{meetup.title}</h1>
            <div className="mt-4 flex flex-col gap-3 md:mt-6 md:grid md:grid-cols-3 md:gap-4">
              <Info icon={<Calendar size={15} />} text={meetup ? new Date(meetup.startsAt).toLocaleString() : '-'} />
              <Info icon={<MapPin size={15} />} text={meetup.location.name} />
              <Info icon={<Users size={15} />} text={`${meetup.appliedCount}${tx.peopleJoined}`} />
            </div>
            <hr className="my-4 border-gray-100" />
            <p className="text-sm leading-relaxed text-gray-600 md:text-base">{meetup.description}</p>
            <div className="mt-4 rounded-xl bg-purple-50 p-3 md:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-purple-700">{meetup.type === 'FREE' ? tx.deposit : tx.fee}</span>
                <span className="text-[14px] font-black text-purple-700">{fee > 0 ? `${fee} DORRI` : tx.free}</span>
              </div>
              <p className="mt-2 text-[11px] text-purple-500">{tx.host}: {meetup.host.name}</p>
            </div>
          </section>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-500">{error}</p>}

          {isOrganizer ? (
            <OrganizerPanel
              meetupId={id}
              applications={applications}
              meetupStatus={meetup?.status ?? ''}
              disabled={isBusy}
              lang={lang}
              onCloseMeetup={handleCloseMeetup}
              onAction={handleApplicationAction}
            />
          ) : applied ? (
            <ParticipantStatus
              meetupId={id}
              status={meetup?.myApplication?.status ?? ''}
              canReview={canReview}
              canCancel={meetup?.myApplication?.status === 'PENDING_APPROVAL' || meetup?.myApplication?.status === 'APPROVED'}
              disabled={isBusy}
              lang={lang}
              onCancel={requestCancelApplication}
            />
          ) : (
            <button
              onClick={() => setShowModal(true)}
              disabled={meetup?.status !== 'PUBLISHED'}
              className="mt-4 w-full rounded-2xl py-4 text-base font-bold text-white shadow-lg disabled:bg-gray-300 md:h-14"
              style={meetup?.status === 'PUBLISHED' ? { background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' } : undefined}
            >
              {tx.apply}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-[390px] rounded-t-3xl bg-white p-6 pb-24 md:max-w-[520px] md:rounded-3xl md:pb-6">
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-gray-200" />
            <h2 className="text-center text-[18px] font-black text-[#232129]">{tx.applyTitle}</h2>
            <p className="mt-1 text-center text-[13px] text-gray-500">{meetup?.title}</p>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
              <span className="text-[13px] font-medium text-gray-500">{meetup?.type === 'FREE' ? tx.deposit : tx.fee}</span>
              <span className="text-[14px] font-black text-[#232129]">{fee > 0 ? `${fee} DORRI` : tx.free}</span>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-2xl border-2 border-gray-200 py-3.5 text-[14px] font-bold text-gray-500">
                {tx.cancel}
              </button>
              <button onClick={handleApply} disabled={isBusy} className="flex-1 rounded-2xl bg-[#6D28D9] py-3.5 text-[14px] font-bold text-white disabled:opacity-50">
                {isBusy ? tx.processing : tx.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCancelModal && meetup?.myApplication && (
        <CancelApplicationModal
          meetup={meetup}
          lang={lang}
          disabled={isBusy}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={confirmCancelApplication}
        />
      )}
      <BottomNav />
    </div>
  )
}

function Info({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className="flex items-center gap-2 text-sm text-gray-500"><span className="text-purple-400">{icon}</span>{text}</div>
}

function MeetupDetailSkeleton() {
  return (
    <div className="app-shell min-h-dvh bg-gray-50 pb-24 md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:pb-12 md:pt-28">
      <div className="md:mx-auto md:grid md:max-w-6xl md:grid-cols-[440px_minmax(0,1fr)] md:gap-8">
        <div className="relative flex h-52 animate-pulse items-center justify-center bg-purple-100 md:h-[560px] md:rounded-[32px]" />
        <div className="mt-4 px-5 md:mt-0 md:px-0">
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm md:p-8">
            <div className="h-5 w-20 animate-pulse rounded-full bg-purple-50" />
            <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-gray-100 md:h-12" />
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-5 animate-pulse rounded bg-gray-100" />)}
            </div>
            <div className="my-4 border-t border-gray-100" />
            <div className="space-y-2">
              <div className="h-4 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="mt-4 h-20 animate-pulse rounded-xl bg-purple-50" />
          </section>
          <div className="mt-4 h-24 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
      <BottomNav />
    </div>
  )
}

function ParticipantStatus({
  meetupId,
  status,
  canReview,
  canCancel,
  disabled,
  lang,
  onCancel,
}: {
  meetupId: string
  status: string
  canReview: boolean
  canCancel: boolean
  disabled: boolean
  lang: Lang
  onCancel: () => void
}) {
  const tx = copy[lang]
  const label = statusLabels[lang][status as keyof typeof statusLabels.KOR] ?? status

  return (
    <div className="mt-4">
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Check size={18} className="text-green-600" />
          <span className="font-bold text-green-600">{tx.participantStatus}: {label}</span>
        </div>
        {canReview && (
          <Link href={`/meetups/${meetupId}/review`} className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-[#6D28D9] px-6 text-sm font-bold text-white">
            {tx.writeReview}
          </Link>
        )}
      </div>
      {canCancel && (
        <button onClick={onCancel} disabled={disabled} className="mt-3 w-full text-center text-[12px] font-semibold text-gray-400 underline-offset-4 hover:text-red-500 hover:underline disabled:opacity-40">
          {lang === 'KOR' ? '참가 신청 취소' : 'Cancel Application'}
        </button>
      )}
    </div>
  )
}

function CancelApplicationModal({
  meetup,
  lang,
  disabled,
  onCancel,
  onConfirm,
}: {
  meetup: MeetupDetail
  lang: Lang
  disabled: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const policy = getCancelPolicyMessage(meetup, lang)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative max-h-[calc(100dvh-104px)] w-full max-w-[390px] overflow-y-auto rounded-t-3xl bg-white p-6 pb-28 shadow-2xl md:max-h-[calc(100vh-64px)] md:max-w-[520px] md:rounded-3xl md:pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200 md:hidden" />
        <h2 className="text-center text-[18px] font-black text-[#232129]">
          {lang === 'KOR' ? '밋업 참가 신청을 취소하시겠습니까?' : 'Cancel your meetup application?'}
        </h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-gray-500">{policy.summary}</p>
        <div className="mt-5 rounded-2xl bg-[#F8F6FF] p-4 text-[13px] leading-relaxed text-[#4F4A5F]">
          <p className="font-bold text-[#232129]">{policy.refund}</p>
          <p className="mt-2">{policy.reputation}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} disabled={disabled} className="flex-1 rounded-2xl border-2 border-gray-200 py-3.5 text-[14px] font-bold text-gray-500 disabled:opacity-40">
            {lang === 'KOR' ? '돌아가기' : 'Keep Application'}
          </button>
          <button onClick={onConfirm} disabled={disabled} className="flex-1 rounded-2xl bg-[#EF4444] py-3.5 text-[14px] font-bold text-white disabled:opacity-40">
            {lang === 'KOR' ? '신청 취소' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getCancelPolicyMessage(meetup: MeetupDetail, lang: Lang) {
  const status = meetup.myApplication?.status

  if (status === 'PENDING_APPROVAL') {
    return lang === 'KOR'
      ? {
          summary: '아직 주최자가 수락하기 전이라 취소해도 불이익 없이 처리됩니다.',
          refund: '잠긴 DORRI는 전액 환불됩니다.',
          reputation: '신뢰 별점에는 영향이 없습니다.',
        }
      : {
          summary: 'The organizer has not approved your request yet, so there is no penalty.',
          refund: 'Your locked DORRI will be fully refunded.',
          reputation: 'Your trust score will not change.',
        }
  }

  const startsAt = new Date(meetup.startsAt).getTime()
  const hoursUntilStart = (startsAt - Date.now()) / (1000 * 60 * 60)
  const isPaid = meetup.type === 'PAID'

  if (hoursUntilStart >= 48) {
    return lang === 'KOR'
      ? {
          summary: '밋업 시작 48시간 전 취소 정책이 적용됩니다.',
          refund: isPaid ? '참가비의 90%가 환불되고, 10%는 플랫폼 수수료로 처리됩니다.' : '보증금은 전액 환불됩니다.',
          reputation: '신뢰 별점에는 영향이 없습니다.',
        }
      : {
          summary: 'The 48+ hour cancellation policy applies.',
          refund: isPaid ? '90% of the fee will be refunded and 10% is kept as a platform fee.' : 'Your deposit will be fully refunded.',
          reputation: 'Your trust score will not change.',
        }
  }

  if (hoursUntilStart >= 24) {
    return lang === 'KOR'
      ? {
          summary: '밋업 시작 24~48시간 전 취소 정책이 적용됩니다.',
          refund: isPaid ? '참가비의 70%가 환불되고, 20%는 주최자에게, 10%는 플랫폼 수수료로 정산됩니다.' : '보증금의 90%가 환불되고, 10%는 주최자에게 정산됩니다.',
          reputation: '신뢰 별점이 0.1점 감점될 예정입니다.',
        }
      : {
          summary: 'The 24-48 hour cancellation policy applies.',
          refund: isPaid ? '70% of the fee will be refunded, 20% goes to the host, and 10% is kept as a platform fee.' : '90% of the deposit will be refunded and 10% goes to the host.',
          reputation: 'Your trust score will decrease by 0.1.',
        }
  }

  return lang === 'KOR'
    ? {
        summary: '밋업 시작 24시간 이내 취소 정책이 적용됩니다.',
        refund: isPaid ? '참가비의 50%가 환불되고, 40%는 주최자에게, 10%는 플랫폼 수수료로 정산됩니다.' : '보증금의 70%가 환불되고, 30%는 주최자에게 정산됩니다.',
        reputation: '신뢰 별점이 0.3점 감점될 예정입니다.',
      }
    : {
        summary: 'The within-24-hour cancellation policy applies.',
        refund: isPaid ? '50% of the fee will be refunded, 40% goes to the host, and 10% is kept as a platform fee.' : '70% of the deposit will be refunded and 30% goes to the host.',
        reputation: 'Your trust score will decrease by 0.3.',
      }
}

function OrganizerPanel({ meetupId, applications, meetupStatus, disabled, lang, onCloseMeetup, onAction }: {
  meetupId: string
  applications: OrganizerApplication[]
  meetupStatus: string
  disabled: boolean
  lang: Lang
  onCloseMeetup: () => void
  onAction: (applicationId: string, action: OrganizerAction) => void
}) {
  const tx = copy[lang]
  const isClosed = meetupStatus === 'CLOSED'
  const hasReviewTargets = applications.some((application) => {
    if (['CHECKED_IN', 'NO_SHOW', 'REVIEWED'].includes(application.status)) return true
    return application.status === 'SETTLED' && Boolean(application.settlement && organizerReviewSettlementReasons.includes(application.settlement.reason))
  })

  return (
    <section className="mt-4 rounded-3xl border border-purple-100 bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-[#232129]">{tx.organizerPanel}</h2>
          <p className="mt-1 text-xs text-gray-500">{tx.organizerHelp}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isClosed && hasReviewTargets && (
            <Link href={`/meetups/${meetupId}/review`} className="rounded-2xl border border-purple-100 bg-purple-50 px-5 py-3 text-center text-sm font-bold text-purple-700">
              {tx.reviewParticipants}
            </Link>
          )}
          <button onClick={onCloseMeetup} disabled={disabled || isClosed} className="rounded-2xl bg-[#6D28D9] px-5 py-3 text-sm font-bold text-white disabled:bg-gray-300">
            {isClosed ? tx.closed : tx.closeMeetup}
          </button>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        {applications.map((application) => (
          <OrganizerApplicationCard
            key={application.id}
            application={application}
            isClosed={isClosed}
            disabled={disabled}
            lang={lang}
            onAction={onAction}
          />
        ))}
        {applications.length === 0 && <p className="rounded-2xl border border-gray-100 p-8 text-center text-sm font-semibold text-gray-400">{tx.noApplications}</p>}
      </div>
    </section>
  )
}

function OrganizerApplicationCard({ application, isClosed, disabled, lang, onAction }: {
  application: OrganizerApplication
  isClosed: boolean
  disabled: boolean
  lang: Lang
  onAction: (applicationId: string, action: OrganizerAction) => void
}) {
  const tx = copy[lang]
  const isPending = application.status === 'PENDING_APPROVAL'
  const isApproved = application.status === 'APPROVED'
  const settlementReason = application.settlement?.reason
  const isAttendedSettlement = application.status === 'SETTLED' && (settlementReason === 'FREE_ATTENDED' || settlementReason === 'PAID_ATTENDED')
  const isNoShowSettlement = application.status === 'SETTLED' && (settlementReason === 'FREE_NO_SHOW' || settlementReason === 'PAID_NO_SHOW')
  const isCheckedIn = application.status === 'CHECKED_IN'
  const isNoShow = application.status === 'NO_SHOW' || isNoShowSettlement
  const statusLabel = statusLabels[lang][application.status as keyof typeof statusLabels.KOR] ?? application.status

  return (
    <div className="rounded-2xl border border-gray-100 bg-[#FBFAFF] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-[#232129]">{application.participant.name}</p>
          <p className="mt-1 text-xs text-gray-500">{tx.reputation} {application.participant.reputationScore} · {application.lockedDorriAmount} DORRI</p>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600">{statusLabel}</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {!isClosed && isPending && (
          <>
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'approve')} label={tx.approve} />
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'reject')} label={tx.reject} />
          </>
        )}
        {!isClosed && isApproved && (
          <>
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'check-in')} label={tx.checkIn} />
            <ActionButton disabled={disabled} onClick={() => onAction(application.id, 'no-show')} label={tx.noShow} />
          </>
        )}
        {!isClosed && isCheckedIn && <p className="text-xs font-semibold text-green-600">{tx.checkedInDone}</p>}
        {!isClosed && isNoShow && <p className="text-xs font-semibold text-gray-500">{tx.noShowDone}</p>}
        {isClosed && isNoShow && <p className="text-xs font-semibold text-gray-500">{tx.noShowSettled}</p>}
        {isClosed && isCheckedIn && <p className="text-xs font-semibold text-green-600">{tx.checkedInDone}</p>}
        {isClosed && isAttendedSettlement && <p className="text-xs font-semibold text-green-600">{tx.attendedSettled}</p>}
        {!isPending && !isApproved && !isCheckedIn && !isNoShow && !isAttendedSettlement && <p className="text-xs font-semibold text-gray-500">{tx.completed}</p>}
      </div>
    </div>
  )
}

function ActionButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button disabled={disabled} onClick={onClick} className="rounded-xl border border-purple-100 bg-white px-4 py-2 text-xs font-bold text-purple-600 disabled:bg-gray-50 disabled:text-gray-300">{label}</button>
}
