'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, Users, Wallet } from 'lucide-react'

const tabs = [
  { href: '/home', label: '홈', icon: Home },
  { href: '/meetups', label: '모임', icon: Users },
  { href: '/wallet', label: '지갑', icon: Wallet },
  { href: '/profile', label: '프로필', icon: User },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[390px] -translate-x-1/2 border-t border-gray-100 bg-white">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href)

        return (
          <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${active ? 'bg-purple-100' : ''}`}>
              <Icon size={20} color={active ? '#7B5CF6' : '#9CA3AF'} strokeWidth={active ? 2.2 : 1.8} />
            </span>
            <span className={`text-[10px] font-medium ${active ? 'text-purple-600' : 'text-gray-400'}`}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
