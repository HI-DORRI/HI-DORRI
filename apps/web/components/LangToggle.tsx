'use client'
import { useState } from 'react'

export default function LangToggle() {
  const [lang, setLang] = useState<'KOR' | 'ENG'>('KOR')
  return (
    <button
      onClick={() => setLang(l => l === 'KOR' ? 'ENG' : 'KOR')}
      className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur text-xs font-bold text-gray-700 shadow-sm border border-white/60"
    >
      {lang}
    </button>
  )
}