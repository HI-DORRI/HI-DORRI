'use client'

const t = {
  KOR: {
    title: '계정 만들기',
    subtitle: '가입 방법을 선택해 주세요',
    apple: 'Apple로 회원가입',
    google: 'Google로 회원가입',
    email: '이메일로 회원가입',
    terms: '계속 진행하면 ',
    termsLink: '이용약관',
    and: ' 및 ',
    privacyLink: '개인정보 처리방침',
    termsEnd: '에 동의하게 됩니다.',
    signupTitle: '회원가입',
    fullName: '이름',
    namePlaceholder: '홍길동',
    emailLabel: '이메일',
    passwordLabel: '비밀번호',
    checks: ['8자 이상', '숫자 또는 특수문자 포함', '대문자 포함'],
    continueBtn: '계속',
    haveAccount: '이미 계정이 있으신가요?',
    login: '로그인',
    verifyTitle: '이메일 인증',
    verifySub: '인증 코드를 발송했습니다',
    codeLabel: '6자리 코드 입력',
    resend: '재발송',
    verifyBtn: '인증하기',
    verifyingTitle: '이메일 인증 중...',
    verifyingSubtitle: '잠시만 기다려 주세요',
    verifiedTitle: '이메일 인증 완료!',
    createWallet: '지갑 만들기',
    walletSetup: '지갑 설정',
    walletCreating: '지갑 생성 중',
    walletSteps: ['XRPL 연결 중...', 'DORRI 토큰 설정', 'Validator NFT 발행'],
    waiting: '대기 중',
    inProgress: '진행 중',
    completed: '완료',
    security: '엔터프라이즈 보안',
    securityDesc: '자산은 MPC 및 하드웨어 보안 모듈로 보호됩니다.',
    walletCreated: '지갑이 생성되었어요!',
    walletSubtitle: '밋업에 참여할 준비가 되었어요',
    mainWallet: '메인 지갑',
    balance: '사용 가능 잔액',
    networkReserve: '네트워크 예치금',
    networkDesc: '1.2 XRP는 HI-DORRI가 부담합니다. 별도 결제는 필요하지 않습니다.',
    secure: '안전 & 프라이빗',
    secureDesc: '비수탁형 접근',
    meetupsReady: '밋업 준비 완료',
    meetupsReadyDesc: '즉시 연결 가능',
    startNow: '시작하기',
  },
  ENG: {
    title: 'Create Your Account',
    subtitle: "Choose how you'd like to sign up",
    apple: 'Sign up with Apple',
    google: 'Sign up with Google',
    email: 'Sign up with Email',
    terms: 'By continuing, you agree to our ',
    termsLink: 'Terms of Service',
    and: ' and ',
    privacyLink: 'Privacy Policy',
    termsEnd: '.',
    signupTitle: 'Sign Up',
    fullName: 'Full Name',
    namePlaceholder: 'John Doe',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    checks: ['At least 8 characters long', 'Include a number or special character', 'At least one uppercase letter'],
    continueBtn: 'Continue',
    haveAccount: 'Already have an account?',
    login: 'Log in',
    verifyTitle: 'Verify Your Email',
    verifySub: 'We sent a verification code to',
    codeLabel: 'Enter 6-digit code',
    resend: 'Resend',
    verifyBtn: 'Verify',
    verifyingTitle: 'Verifying your email...',
    verifyingSubtitle: 'Please wait a moment',
    verifiedTitle: 'Email Verified!',
    createWallet: 'Create your Wallet',
    walletSetup: 'Set up your Wallet',
    walletCreating: 'Creating Your Wallet',
    walletSteps: ['Connecting to XRPL...', 'Setting up DORRI token', 'Minting Validator NFT'],
    waiting: 'Waiting',
    inProgress: 'In-progress',
    completed: 'Completed',
    security: 'ENTERPRISE SECURITY',
    securityDesc: 'Your assets are protected by enterprise-grade custodial security. We use multi-party computation (MPC) and hardware security modules to ensure your keys never leave secure environments.',
    walletCreated: 'Wallet Created',
    walletSubtitle: "You're all set to join meetups",
    mainWallet: 'MAIN WALLET',
    balance: 'Available Balance',
    networkReserve: 'Network Reserve',
    networkDesc: '1.2 XRP covered by HI-DORRI. This activation fee is handled by us, so you don\'t have to pay this.',
    secure: 'Secure & Private',
    secureDesc: 'Non-custodial access',
    meetupsReady: 'Meetups Ready',
    meetupsReadyDesc: 'Connect with others instantly',
    startNow: 'Start Now',
  }
}

import { useLang } from '@/components/LangContext'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Check, Mail, Shield, Users } from 'lucide-react'
import Link from 'next/link'

type Step = 'method' | 'form' | 'verify' | 'verifying' | 'verified' | 'wallet' | 'done'

const walletSteps = [
  { label: 'Connecting to XRPL...', key: 'xrpl' },
  { label: 'Setting up DORRI token', key: 'dorri' },
  { label: 'Minting Validator NFT', key: 'nft' },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('method')
  const { lang, setLang } = useLang()

  // form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)

  // verify
  const [codes, setCodes] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // wallet
  const [walletStep, setWalletStep] = useState(0)
  const [walletStatus, setWalletStatus] = useState<('waiting' | 'progress' | 'done')[]>(['waiting', 'waiting', 'waiting'])

  const pwChecks = {
    length: pw.length >= 8,
    numberOrSpecial: /[0-9!@#$%^&*]/.test(pw),
    uppercase: /[A-Z]/.test(pw),
  }
  const pwValid = Object.values(pwChecks).every(Boolean)
  const formValid = name && email && pwValid

  // 인증 로딩
  useEffect(() => {
    if (step === 'verifying') {
      setTimeout(() => setStep('verified'), 2000)
    }
  }, [step])

  // 지갑 생성 애니메이션
  useEffect(() => {
    if (step === 'wallet') {
      const t0 = setTimeout(() => {
        setWalletStatus(['progress', 'waiting', 'waiting'])
        setWalletStep(1)
      }, 0)
      const t1 = setTimeout(() => {
        setWalletStatus(['done', 'progress', 'waiting'])
        setWalletStep(2)
      }, 1500)
      const t2 = setTimeout(() => {
        setWalletStatus(['done', 'done', 'progress'])
        setWalletStep(3)
      }, 3000)
      const t3 = setTimeout(() => {
        setWalletStatus(['done', 'done', 'done'])
        setTimeout(() => setStep('done'), 800)
      }, 4500)
      return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [step])

  const handleCodeChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...codes]
    next[i] = val.slice(-1)
    setCodes(next)
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleCodeKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  // 가입 방법 선택
  if (step === 'method') {
  const tx = t[lang]
  return (
    <div className="app-shell auth-shell min-h-dvh flex flex-col items-center justify-between pb-10 px-5 pt-2 bg-white md:my-12 md:min-h-[720px] md:rounded-[32px] md:px-8 md:pt-8 md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="w-full flex justify-end">
        <button
          onClick={() => setLang(lang === 'KOR' ? 'ENG' : 'KOR')}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-600">
          {lang}
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
        <div className="text-center">
          <h1 className="text-[28px] font-black text-[#232129]">{tx.title}</h1>
          <p className="text-[14px] text-gray-400 mt-1">{tx.subtitle}</p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <button className="w-full py-4 rounded-2xl bg-[#1a1a1a] text-white font-bold text-[15px] flex items-center justify-center gap-3">
            {tx.apple}
          </button>
          <button className="w-full py-4 rounded-2xl border-2 border-gray-200 font-bold text-[15px] flex items-center justify-center gap-3 text-[#232129]">
            {tx.google}
          </button>
          <div className="flex items-center gap-3 my-1">
            <hr className="flex-1 border-gray-200" />
            <span className="text-[12px] text-gray-400 font-medium">OR</span>
            <hr className="flex-1 border-gray-200" />
          </div>
          <button onClick={() => setStep('form')}
            className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
            style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
            {tx.email}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-gray-400 text-center leading-relaxed">
        {tx.terms}
        <span className="text-purple-600 font-semibold">{tx.termsLink}</span>
        {tx.and}
        <span className="text-purple-600 font-semibold">{tx.privacyLink}</span>
        {tx.termsEnd}
      </p>
    </div>
  )
}

  // 이메일 입력
  if (step === 'form') {
    const tx = t[lang]
    return (
    <div className="app-shell auth-shell min-h-dvh bg-white pb-10 md:my-12 md:min-h-[720px] md:rounded-[32px] md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="px-5 pt-2 pb-4 border-b border-gray-100 md:pt-12">
        <button onClick={() => setStep('method')} className="p-2 -ml-2 mb-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[26px] font-black text-[#232129]">{tx.signupTitle}</h1>
      </div>
      <div className="px-5 mt-6 flex flex-col gap-5">
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">{tx.fullName}</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={tx.namePlaceholder}
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition bg-gray-50" />
        </div>
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">{tx.emailLabel}</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com" type="email"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition bg-gray-50" />
        </div>
        <div>
          <label className="text-[13px] font-bold text-[#232129] mb-2 block">{tx.passwordLabel}</label>
          <div className="relative">
            <input value={pw} onChange={e => setPw(e.target.value)}
              placeholder="Min. 8 characters" type={showPw ? 'text' : 'password'}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-[14px] outline-none focus:border-purple-400 transition bg-gray-50 pr-12" />
            <button onClick={() => setShowPw(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {[
              { key: 'length', label: tx.checks[0] },
              { key: 'numberOrSpecial', label: tx.checks[1] },
              { key: 'uppercase', label: tx.checks[2] },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition
                  ${pwChecks[key as keyof typeof pwChecks] ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                  {pwChecks[key as keyof typeof pwChecks] && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <span className={`text-[12px] font-medium ${pwChecks[key as keyof typeof pwChecks] ? 'text-purple-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <button disabled={!formValid} onClick={() => setStep('verify')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px] disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          {tx.continueBtn}
        </button>
        <p className="text-center text-[12px] text-gray-400">
          {tx.haveAccount}{' '}
          <Link href="/login" className="text-purple-600 font-bold">{tx.login}</Link>
        </p>
      </div>
    </div>
  )}


  // 이메일 인증
  if (step === 'verify') {
    const tx = t[lang]
    return (
    <div className="app-shell auth-shell min-h-dvh bg-white pb-10 md:my-12 md:min-h-[720px] md:rounded-[32px] md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="px-5 pt-2 pb-4 md:pt-12">
        <button onClick={() => setStep('form')} className="p-2 -ml-2">
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="px-5 flex flex-col items-center mt-8">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-6">
          <Mail size={32} className="text-purple-600" />
        </div>
        <h1 className="text-[24px] font-black text-[#232129]">{tx.verifyTitle}</h1>
        <p className="text-[13px] text-gray-400 mt-2 text-center leading-relaxed">
          {tx.verifySub}<br />
          <span className="font-semibold text-gray-600">{email}</span>
        </p>
        <div className="mt-8 w-full">
          <p className="text-[13px] font-bold text-[#232129] mb-3">{tx.codeLabel}</p>
          <div className="flex gap-2 justify-between">
            {codes.map((c, i) => (
              <input key={i}
                ref={el => { inputRefs.current[i] = el }}
                value={c}
                onChange={e => handleCodeChange(i, e.target.value)}
                onKeyDown={e => handleCodeKey(i, e)}
                maxLength={1} inputMode="numeric"
                className={`w-full aspect-square rounded-2xl border-2 text-center text-[20px] font-black outline-none transition
                  ${c ? 'border-purple-400 bg-purple-50 text-purple-600' : 'border-gray-200 bg-gray-50 text-gray-400'}`}
              />
            ))}
          </div>
          <p className="text-center text-[12px] text-gray-400 mt-4">
            {lang === 'KOR' ? '코드를 받지 못하셨나요?' : "Didn't receive?"}{' '}
            <button className="text-purple-600 font-bold">{tx.resend}</button>
          </p>
        </div>
        <button disabled={codes.some(c => !c)} onClick={() => setStep('verifying')}
          className="w-full py-4 rounded-2xl font-bold text-white text-[15px] disabled:opacity-40 mt-8"
          style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
          {tx.verifyBtn}
        </button>
      </div>
    </div>
  )}

  // 인증 중
if (step === 'verifying') {
    const tx = t[lang]
    return (
    <div className="app-shell auth-shell min-h-dvh bg-white flex flex-col items-center justify-center gap-4 md:my-12 md:min-h-[720px] md:rounded-[32px] md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="w-16 h-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
      <h2 className="text-[18px] font-black text-[#232129]">{tx.verifyingTitle}</h2>
      <p className="text-[13px] text-gray-400">{tx.verifyingSubtitle}</p>
    </div>
  )}

  // 인증 완료
if (step === 'verified') {
    const tx = t[lang]
    return (
    <div className="app-shell auth-shell min-h-dvh bg-white flex flex-col items-center justify-center px-5 gap-6 md:my-12 md:min-h-[720px] md:rounded-[32px] md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <Check size={36} className="text-green-500" strokeWidth={3} />
      </div>
      <h1 className="text-[26px] font-black text-[#232129]">{tx.verifiedTitle}</h1>
      <button onClick={() => setStep('wallet')}
        className="w-full py-4 rounded-2xl font-bold text-white text-[15px]"
        style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
        {tx.createWallet}
      </button>
    </div>
  )}

  // 지갑 생성 중
   if (step === 'wallet') {
    const tx = t[lang]
    return (
    <div className="app-shell auth-shell min-h-dvh bg-white px-5 pt-2 pb-10 md:my-12 md:min-h-[720px] md:rounded-[32px] md:px-8 md:pt-16 md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="text-center mb-8">
        <p className="text-[12px] font-bold text-purple-600 uppercase tracking-wider">{tx.walletSetup}</p>
        <h1 className="text-[22px] font-black text-[#232129] mt-1">{tx.walletCreating}</h1>
        <p className="text-[13px] text-gray-400 mt-1">Step {walletStep} of 3</p>
      </div>
      <div className="flex flex-col gap-3">
        {walletSteps.map((ws, i) => {
          const status = walletStatus[i]
          return (
            <div key={ws.key} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition
              ${status === 'done' ? 'border-green-200 bg-green-50' :
                status === 'progress' ? 'border-purple-300 bg-purple-50' : 'border-gray-200 bg-white'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${status === 'done' ? 'bg-green-500' : status === 'progress' ? 'bg-transparent' : 'bg-gray-200'}`}>
                {status === 'done' && <Check size={18} className="text-white" strokeWidth={3} />}
                {status === 'progress' && <div className="w-6 h-6 rounded-full border-t-purple-600 border-purple-200 animate-spin" style={{ borderWidth: '3px', borderStyle: 'solid' }} />}
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#232129]">{tx.walletSteps[i]}</p>
                <p className={`text-[12px] font-semibold mt-0.5
                  ${status === 'done' ? 'text-green-600' : status === 'progress' ? 'text-purple-600' : 'text-gray-400'}`}>
                  {status === 'done' ? tx.completed : status === 'progress' ? tx.inProgress : tx.waiting}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-8 p-5 rounded-2xl bg-gray-50 border border-gray-100">
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-wider mb-2">{tx.security}</p>
        <p className="text-[12px] text-gray-500 leading-relaxed">{tx.securityDesc}</p>
      </div>
    </div>
  )}

  // 완료
  if (step === 'done') {
    const tx = t[lang]
    return (
    <div className="app-shell auth-shell min-h-dvh bg-white px-5 pt-2 pb-10 flex flex-col md:my-12 md:min-h-[720px] md:rounded-[32px] md:px-8 md:pt-16 md:shadow-[0_20px_56px_rgba(44,35,77,0.1)]">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check size={28} className="text-green-500" strokeWidth={3} />
        </div>
        <h1 className="text-[24px] font-black text-[#232129]">{tx.walletCreated}</h1>
        <p className="text-[13px] text-gray-400 mt-1">{tx.walletSubtitle}</p>
      </div>
      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
        <div className="bg-[#7446D8] px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">{tx.mainWallet}</p>
            <p className="text-[13px] font-mono text-white mt-1">rSARAH1234567890ab...</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <Check size={12} className="text-white" />
            <span className="text-[11px] font-bold text-white">Verified</span>
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-[12px] text-gray-400 font-medium">{tx.balance}</p>
            <p className="text-[16px] font-black text-purple-600 mt-0.5">0 DORRI</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Shield size={18} className="text-purple-400" />
          </div>
        </div>
      </div>
      <div className="mt-4 p-4 rounded-2xl border border-purple-100 bg-purple-50 flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-purple-600 text-[11px] font-black">i</span>
        </div>
        <div>
          <p className="text-[12px] font-bold text-purple-700">{tx.networkReserve}</p>
          <p className="text-[11px] text-purple-600 mt-0.5 leading-relaxed">{tx.networkDesc}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center mb-3">
            <Shield size={18} className="text-white" />
          </div>
          <p className="text-[13px] font-black text-[#232129]">{tx.secure}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{tx.secureDesc}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center mb-3">
            <Users size={18} className="text-white" />
          </div>
          <p className="text-[13px] font-black text-[#232129]">{tx.meetupsReady}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{tx.meetupsReadyDesc}</p>
        </div>
      </div>
      <button onClick={() => router.push('/home')}
        className="w-full py-4 rounded-2xl font-bold text-white text-[15px] mt-auto"
        style={{ background: 'linear-gradient(90deg, #7B5CF6, #6D28D9)' }}>
        {tx.startNow}
      </button>
    </div>
  )}

  return null
}

