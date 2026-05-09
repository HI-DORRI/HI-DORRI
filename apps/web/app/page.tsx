'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLang } from '@/components/LangContext'

const t = {
  KOR: {
    signup: '회원가입',
    haveAccount: '이미 계정이 있으신가요?',
    login: '로그인',
  },
  ENG: {
    signup: 'Sign Up',
    haveAccount: 'Already have an account?',
    login: 'Log in',
  },
}

export default function Landing() {
  const { lang, setLang } = useLang()
  const tx = t[lang]

  return (
    <main className="min-h-dvh bg-[#F6F3FF] md:flex md:items-center md:justify-center md:px-10 md:py-12">
      <div
        className="app-shell auth-shell relative flex min-h-dvh flex-col overflow-hidden md:min-h-[720px] md:rounded-[36px] md:shadow-[0_20px_56px_rgba(44,35,77,0.12)]"
        style={{ background: 'linear-gradient(180deg, #B39DFA 0%, #C4B5FD 30%, #DDD6FE 60%, #EDE9FE 100%)' }}
      >
        <div
          className="absolute left-1/2 top-[-80px] h-[340px] w-[340px] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)' }}
        />
        <div
          className="absolute left-1/2 top-[20px] h-[220px] w-[220px] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
        />

        <div className="absolute right-4 top-4 z-10">
          <button
            onClick={() => setLang(lang === 'KOR' ? 'ENG' : 'KOR')}
            className="rounded-xl border border-white/60 bg-white/90 px-4 py-2 text-[13px] font-black text-gray-700 shadow-sm backdrop-blur"
          >
            {lang}
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-10">
          <Image
            src="/images/main logo.png"
            alt="HI-DORRI"
            width={280}
            height={132}
            priority
            className="mx-auto h-auto w-[240px] md:w-[300px]"
          />
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 pb-12 md:px-10">
          <Link
            href="/signup"
            className="w-full rounded-2xl py-4 text-center text-[16px] font-bold text-white shadow-lg"
            style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}
          >
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
    </main>
  )
}
