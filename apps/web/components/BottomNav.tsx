'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, Users, Wallet } from 'lucide-react'

const tabs = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/meetups', label: 'Meetups', icon: Users },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex h-[78px] w-full max-w-[390px] -translate-x-1/2 items-center justify-around border-t border-[#ECE8F4] bg-white px-5 shadow-[0_-8px_18px_rgba(31,25,45,0.04)] md:hidden">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href)

        return (
          <Link key={href} href={href} className="flex min-w-0 flex-1 justify-center">
            <span
              className={`flex h-16 w-[70px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
                active ? 'bg-[#F0EAFF] text-primary' : 'text-[#B8B5C0]'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-bold">{label}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
