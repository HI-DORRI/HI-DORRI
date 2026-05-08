'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, MoreVertical, Search, Star, X } from 'lucide-react'
import Image from 'next/image'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    title: '참가자 평가',
    bulkTitle: '일괄 평가',
    bulkDesc: '모든 참가자에게 기본 평점 부여',
    searchPlaceholder: '참가자 검색...',
    listTitle: '참가자 명단',
    detailBtn: '상세 평가',
    submitAll: '평가 완료 및 제출',
    detailTitle: '참가자 평가하기',
    detailDesc: '해당 참가자는 어떠하나요?',
    reviewLabel: '상세 후기',
    reviewPlaceholder: '자세한 후기를 남겨주세요.',
    submitDetail: '상세 평가 제출',
    joinComplete: '참가 완료',
    notAttended: '미참여',
    people: '명',
  },
  ENG: {
    title: 'Participant Review',
    bulkTitle: 'Bulk Rating',
    bulkDesc: 'Apply a base rating to all participants',
    searchPlaceholder: 'Search participants...',
    listTitle: 'Participants',
    detailBtn: 'Review',
    submitAll: 'Complete & Submit',
    detailTitle: 'Rate Participant',
    detailDesc: 'How was this participant?',
    reviewLabel: 'Detailed Review',
    reviewPlaceholder: 'Leave a detailed review...',
    submitDetail: 'Submit Review',
    joinComplete: 'Attended',
    notAttended: 'Absent',
    people: ' people',
  }
}

const participants = [
  { id: '1', name: 'Sarah Johnson', status: 'attended', rating: 4.9, reviews: 5, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80' },
  { id: '2', name: 'Daniel Kim', status: 'attended', rating: 4.7, reviews: 3, avatar: '' },
  { id: '3', name: 'Minji Park', status: 'attended', rating: 4.5, reviews: 8, avatar: '' },
  { id: '4', name: 'Hana Kim', status: 'attended', rating: 4.8, reviews: 2, avatar: '' },
  { id: '5', name: '김수지', status: 'attended', rating: 4.2, reviews: 4, avatar: '' },
  { id: '6', name: '박정준', status: 'attended', rating: 4.6, reviews: 6, avatar: '' },
  { id: '7', name: '오현준', status: 'attended', rating: 4.3, reviews: 1, avatar: '' },
  { id: '8', name: 'Alex Chen', status: 'absent', rating: 0, reviews: 0, avatar: '' },
  { id: '9', name: '조민우', status: 'absent', rating: 0, reviews: 0, avatar: '', note: '27시간 전 환불' },
]

function StarRating({ value, onChange, size = 20 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i}
          onMouseEnter={() => onChange && setHovered(i)}
          onMouseLeave={() => onChange && setHovered(0)}
          onClick={() => onChange?.(i)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}>
          <Star size={size}
            fill={i <= (hovered || value) ? '#F59E0B' : 'none'}
            className={i <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'}
            strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}

export default function ReviewPage() {
  const { lang } = useLang()
  const tx = t[lang]
  const router = useRouter()
  const [bulkRating, setBulkRating] = useState(0)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [detailRating, setDetailRating] = useState(0)
  const [detailReview, setDetailReview] = useState('')

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedParticipant = participants.find(p => p.id === selected)

  const handleBulkRating = (v: number) => {
    setBulkRating(v)
    const newRatings: Record<string, number> = {}
    participants.filter(p => p.status === 'attended').forEach(p => {
      newRatings[p.id] = v
    })
    setRatings(newRatings)
  }

  // 상세 평가 화면
  if (selected && selectedParticipant) {
    return (
      <div className="app-shell bg-white min-h-dvh pb-10">
        <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
          <button onClick={() => { setSelected(null); setDetailRating(0); setDetailReview('') }} className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-[16px] font-black text-[#232129]">{tx.title}</h1>
          <button className="p-2 -mr-2"><MoreVertical size={18} /></button>
        </div>

        <div className="px-5 mt-6">
          {/* 참가자 정보 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {selectedParticipant.avatar ? (
                <Image src={selectedParticipant.avatar} alt={selectedParticipant.name} fill sizes="56px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-400 font-black text-xl">
                  {selectedParticipant.name[0]}
                </div>
              )}
            </div>
            <div>
              <p className="text-[16px] font-black text-[#232129]">{selectedParticipant.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} fill="#F59E0B" className="text-yellow-400" />
                <span className="text-[12px] text-gray-500">{selectedParticipant.rating} ({selectedParticipant.reviews}{lang === 'KOR' ? '개 리뷰' : ' reviews'})</span>
              </div>
            </div>
          </div>

          {/* 별점 */}
          <div className="text-center mb-6">
            <p className="text-[15px] font-black text-[#232129] mb-1">{tx.detailTitle}</p>
            <p className="text-[13px] text-gray-400 mb-4">{tx.detailDesc}</p>
            <div className="flex justify-center">
              <StarRating value={detailRating} onChange={setDetailRating} size={40} />
            </div>
          </div>

          {/* 상세 후기 */}
          <div>
            <label className="text-[13px] font-bold text-[#232129] mb-2 block">{tx.reviewLabel}</label>
            <textarea
              value={detailReview}
              onChange={e => setDetailReview(e.target.value)}
              placeholder={tx.reviewPlaceholder}
              rows={5}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-[13px] outline-none focus:border-purple-400 resize-none transition"
            />
          </div>

          <button
            disabled={detailRating === 0}
            onClick={() => {
              setRatings(r => ({ ...r, [selected]: detailRating }))
              setSelected(null)
              setDetailRating(0)
              setDetailReview('')
            }}
            className="w-full mt-6 py-4 rounded-2xl font-bold text-white text-[15px] disabled:opacity-40"
            style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
            {tx.submitDetail}
          </button>
        </div>
      </div>
    )
  }

  // 목록 화면
  return (
    <div className="app-shell bg-white min-h-dvh pb-24">
      <div className="flex items-center justify-between px-5 pt-12 pb-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[16px] font-black text-[#232129]">{tx.title}</h1>
        <button className="p-2 -mr-2"><MoreVertical size={18} /></button>
      </div>

      <div className="px-5 mt-5">
        {/* 일괄 평가 */}
        <div className="bg-gray-50 rounded-2xl p-5 text-center mb-5">
          <p className="text-[15px] font-black text-[#232129]">{tx.bulkTitle}</p>
          <p className="text-[12px] text-gray-400 mt-1 mb-4">{tx.bulkDesc}</p>
          <div className="flex justify-center">
            <StarRating value={bulkRating} onChange={handleBulkRating} size={32} />
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tx.searchPlaceholder}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-[13px] outline-none focus:border-purple-400 transition bg-gray-50"
          />
        </div>

        {/* 참가자 목록 */}
        <p className="text-[14px] font-black text-[#232129] mb-3">
          {tx.listTitle} ({participants.length}{tx.people === '명' ? tx.people : tx.people})
        </p>

        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2">
              {/* 아바타 */}
              <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0">
                {p.avatar ? (
                  <Image src={p.avatar} alt={p.name} fill sizes="44px" className="object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-black text-base
                    ${p.status === 'absent' ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-400'}`}>
                    {p.name[0]}
                  </div>
                )}
              </div>

              {/* 이름 & 상태 */}
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-bold truncate ${p.status === 'absent' ? 'text-gray-400' : 'text-[#232129]'}`}>
                  {p.name}
                </p>
                <p className={`text-[11px] mt-0.5 ${p.status === 'absent' ? 'text-red-400' : 'text-gray-400'}`}>
                  {p.note || (p.status === 'attended' ? tx.joinComplete : tx.notAttended)}
                </p>
              </div>

              {/* 별점 */}
              <div className="flex-shrink-0">
                <StarRating value={ratings[p.id] || 0} size={14} />
              </div>

              {/* 버튼들 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setSelected(p.id)}
                  disabled={p.status === 'absent'}
                  className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1.5 rounded-lg disabled:opacity-30">
                  {tx.detailBtn}
                </button>
                <button className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                  <X size={12} className="text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 pb-8 pt-4 bg-white border-t border-gray-100">
        <button
          onClick={() => router.push('/home')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
          style={{ background: Object.keys(ratings).length > 0 ? 'linear-gradient(90deg, #7B5CF6, #6D28D9)' : '#D1D5DB' }}>
          {tx.submitAll}
        </button>
      </div>
    </div>
  )
}