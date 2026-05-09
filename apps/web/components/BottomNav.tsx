'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Home, Users, Wallet, User } from 'lucide-react'
import { useLang } from '@/components/LangContext'

export default function BottomNav() {
  const path = usePathname()
  const { lang } = useLang()

  const tabs = [
    { href: '/home', label: lang === 'KOR' ? '홈' : 'Home', icon: Home },
    { href: '/meetups', label: lang === 'KOR' ? '밋업' : 'Meetups', icon: Users },
    { href: '/wallet', label: lang === 'KOR' ? '지갑' : 'Wallet', icon: Wallet },
    { href: '/profile', label: lang === 'KOR' ? '내 프로필' : 'Profile', icon: User },
  ]

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 hidden w-full border-b border-[#E9E3F4] bg-white/90 backdrop-blur md:block">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
          <Link href="/home" className="flex items-center">
            <Image src="/images/small logo2.png" alt="HI-DORRI" width={78} height={32} className="h-auto w-[78px]" />
          </Link>
          <div className="flex items-center gap-2">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = path.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                    active ? 'bg-[#F0EAFF] text-[#6F3FD7]' : 'text-[#6B6574] hover:bg-[#F8F5FF]'
                  }`}
                >
                  <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[390px] -translate-x-1/2 border-t border-gray-100 bg-white md:hidden">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-3">
              <span className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all ${active ? 'bg-purple-100' : ''}`}>
                <Icon size={20} color={active ? '#7B5CF6' : '#9CA3AF'} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span className={`text-[10px] font-medium ${active ? 'text-purple-600' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
