'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useLang } from '@/components/LangContext'
import { apiFetch, setAccessToken } from '@/lib/api'

const t = {
  KOR: {
    title: '로그인',
    subtitle: 'HI-DORRI 여정을 계속해보세요.',
    email: '이메일',
    password: '비밀번호',
    forgot: '비밀번호를 잊으셨나요?',
    login: '로그인',
    noAccount: '아직 계정이 없으신가요?',
    signup: '회원가입',
    heroTitle: 'DORRI와 함께하는 글로벌 밋업',
    heroCopy: '지갑을 연결하고, 밋업에 참여하고, DORRI로 안전하게 정산하세요.',
  },
  ENG: {
    title: 'Log In',
    subtitle: 'Continue your HI-DORRI journey.',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot password?',
    login: 'Log In',
    noAccount: "Don't have an account?",
    signup: 'Sign Up',
    heroTitle: 'Global meetups powered by DORRI',
    heroCopy: 'Connect your wallet, join meetups, and settle safely with DORRI.',
  },
}

export default function LoginPage() {
  const router = useRouter()
  const { lang } = useLang()
  const tx = t[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        skipAuth: true,
        body: { email, password },
      })

      setAccessToken(result.accessToken)
      router.push('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell min-h-dvh bg-white text-[#232129] md:min-h-screen md:bg-[#F6F3FF] md:px-10 md:py-20">
      <div className="md:mx-auto md:grid md:max-w-6xl md:grid-cols-[minmax(0,1fr)_440px] md:overflow-hidden md:rounded-[36px] md:bg-white md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
        <section className="relative hidden overflow-hidden bg-[#7446D8] p-10 text-white md:flex md:min-h-[640px] md:flex-col md:justify-end">
          <div className="absolute right-[-80px] top-[-70px] h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute left-12 top-16 h-32 w-32 rounded-[40px] bg-white/10 shadow-[0_20px_50px_rgba(25,18,48,0.18)]" />
          <div className="absolute left-24 top-48 h-24 w-24 rounded-full bg-white/10" />
          <div>
            <Image src="/images/main logo.png" alt="HI-DORRI" width={220} height={104} className="mb-10 h-auto w-[220px] rounded-3xl bg-white/95 p-6 shadow-2xl" />
            <h1 className="text-5xl font-black leading-tight">{tx.heroTitle}</h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">{tx.heroCopy}</p>
          </div>
        </section>

        <section className="flex min-h-dvh flex-col px-6 pb-10 pt-2 md:min-h-0 md:px-10 md:py-10">
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F5FF]">
              <ArrowLeft size={20} />
            </button>
            <Image src="/images/small logo2.png" alt="HI-DORRI" width={76} height={32} className="h-auto w-[76px] md:hidden" />
            <div className="h-10 w-10" />
          </div>

          <div className="mt-12 md:mt-16">
            <p className="text-sm font-bold uppercase tracking-wide text-[#7B5CF6]">{lang === 'KOR' ? '다시 오신 걸 환영해요' : 'Welcome back'}</p>
            <h1 className="mt-2 text-[28px] font-black md:text-4xl">{tx.title}</h1>
            <p className="mt-2 text-[14px] text-[#6B6574] md:text-base">{tx.subtitle}</p>
          </div>

          <form
            className="mt-9 flex flex-col gap-4"
            onSubmit={handleLogin}
          >
            <label className="block">
              <span className="mb-2 block text-[13px] font-bold text-[#232129]">{tx.email}</span>
              <span className="relative block">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A5A0AF]" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="h-[52px] w-full rounded-2xl border border-[#E2DDE8] bg-white pl-12 pr-4 text-[14px] outline-none focus:border-[#7B5CF6]"
                  placeholder="name@example.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-[13px] font-bold text-[#232129]">{tx.password}</span>
              <span className="relative block">
                <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A5A0AF]" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="h-[52px] w-full rounded-2xl border border-[#E2DDE8] bg-white px-12 text-[14px] outline-none focus:border-[#7B5CF6]"
                  placeholder="********"
                />
                <Eye size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A5A0AF]" />
              </span>
            </label>

            <Link href="/signup" className="self-end text-[13px] font-bold text-[#7B5CF6]">
              {tx.forgot}
            </Link>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-500">{error}</p>}

            <button disabled={isSubmitting} type="submit" className="mt-2 h-14 rounded-2xl bg-[#673BD2] text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(103,59,210,0.22)] disabled:opacity-50">
              {isSubmitting ? (lang === 'KOR' ? '로그인 중...' : 'Logging in...') : tx.login}
            </button>
          </form>

          <p className="mt-auto pt-8 text-center text-[13px] text-[#6B6574]">
            {tx.noAccount}{' '}
            <Link href="/signup" className="font-bold text-[#7B5CF6]">
              {tx.signup}
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}

