'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-100 flex z-50">
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
  )
}