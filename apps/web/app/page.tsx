'use client'
import Link from 'next/link'
import { useLang } from '@/components/LangContext'

export default function Landing() {
  const { lang, setLang } = useLang()

  const t = {
    KOR: {
      signup: '회원가입',
      haveAccount: '계정이 있으신가요?',
      login: '로그인하기',
    },
    ENG: {
      signup: 'Sign Up',
      haveAccount: 'Already have an account?',
      login: 'Log in',
    }
  }

  const tx = t[lang]

  return (
    <div className="app-shell flex flex-col min-h-dvh relative"
      style={{ background: 'linear-gradient(180deg, #B39DFA 0%, #C4B5FD 30%, #DDD6FE 60%, #EDE9FE 100%)' }}>

      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[340px] h-[340px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)' }} />
      <div className="absolute top-[20px] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />

      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLang(lang === 'KOR' ? 'ENG' : 'KOR')}
          className="px-4 py-2 rounded-xl bg-white/90 backdrop-blur text-[13px] font-black text-gray-700 shadow-sm border border-white/60">
          {lang}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-end gap-2">
          <div>
            <p className="text-[52px] font-black text-[#1a1a2e] leading-none tracking-tight">Hi-</p>
            <p className="text-[52px] font-black text-[#1a1a2e] leading-none tracking-tight">DORRI</p>
          </div>
          <div className="mb-2 text-[64px] leading-none"
            style={{ filter: 'drop-shadow(0 8px 24px rgba(123,92,246,0.4))' }}>
            🤍
          </div>
        </div>
      </div>

      <div className="px-6 pb-12 flex flex-col gap-3">
        <Link href="/signup"
          className="w-full py-4 rounded-2xl text-white text-[16px] font-bold text-center shadow-lg"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          {tx.signup}
        </Link>
        <p className="text-center text-[13px] text-gray-600">
          {tx.haveAccount}{' '}
          <Link href="/login" className="font-bold text-purple-700 underline underline-offset-2">
            {tx.login}
          </Link>
        </p>
      </div>
    </div>
  )
}