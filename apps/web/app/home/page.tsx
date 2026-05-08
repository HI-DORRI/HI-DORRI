import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftRight, Menu, Plus, Search, Settings, User, WalletCards } from 'lucide-react'
import BottomNav from '../../components/BottomNav'

const quickActions = [
  { label: 'Add Funds', icon: WalletCards },
  { label: 'Explore', icon: Search },
  { label: 'Set your Profile', icon: User },
]

const desktopNav = [
  { href: '/home', label: 'Home' },
  { href: '/meetups', label: 'Meetups' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/profile', label: 'Profile' },
]

export default function HomePage() {
  return (
    <main className="home-shell min-h-screen bg-white pb-32 text-[#202024] md:bg-[#F6F3FF] md:pb-0">
      <header className="bg-white px-4 md:border-b md:border-[#E9E2F8] md:px-8">
        <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center justify-between md:h-20">
          <button aria-label="Open menu" className="flex h-10 w-10 items-center justify-center text-primary md:hidden">
            <Menu size={21} strokeWidth={2.4} />
          </button>

          <Image
            src="/images/small logo2.png"
            alt="HI-DORRI"
            width={72}
            height={30}
            priority
            className="h-auto w-[72px] md:w-[92px]"
          />

          <nav className="hidden items-center gap-8 md:flex">
            {desktopNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-bold text-[#4F4A5F]">
                {item.label}
              </Link>
            ))}
          </nav>

          <button aria-label="Settings" className="flex h-10 w-10 items-center justify-center text-primary">
            <Settings size={20} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl md:px-8 md:py-8">
        <section className="px-5 pt-5 md:px-0 md:pt-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[22px] font-black leading-tight text-[#232129] md:text-4xl">Hi, Sarah!</h1>
              <p className="mt-1 text-[13px] font-medium text-[#4f4a5f] md:mt-2 md:text-base">
                Your global journey continues.
              </p>
            </div>
            <div className="relative h-11 w-11 overflow-hidden rounded-full border-[3px] border-[#7B5CF6] md:h-14 md:w-14">
              <Image
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
                alt="Sarah profile"
                fill
                sizes="(min-width: 768px) 56px, 44px"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <div className="md:mt-8 md:grid md:grid-cols-[minmax(0,1fr)_minmax(340px,424px)] md:gap-6">
          <section className="px-5 pt-5 md:px-0 md:pt-0">
            <div className="relative overflow-hidden rounded-lg bg-[#7446D8] px-5 py-5 text-white shadow-[0_12px_24px_rgba(116,70,216,0.25)] md:min-h-[260px] md:rounded-3xl md:p-8">
              <div className="absolute right-[-28px] top-5 h-28 w-28 rounded-full bg-white/12 md:right-6 md:top-8 md:h-44 md:w-44" />
              <div className="absolute right-7 top-5 h-24 w-24 rounded-full bg-white/10 md:right-28 md:top-8 md:h-36 md:w-36" />
              <div className="absolute right-[-4px] top-16 h-24 w-24 rounded-full bg-white/12 md:right-0 md:top-28 md:h-40 md:w-40" />

              <div className="relative">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-white/90 md:text-base">
                  <span>My Wallet</span>
                </div>
                <p className="mt-5 text-[28px] font-black leading-none md:text-5xl">0 DORRI</p>

                <div className="mt-8 flex gap-3 md:max-w-md">
                  <Link
                    href="/wallet/add-funds"
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-bold text-[#7446D8] shadow-sm"
                  >
                    <Plus size={17} strokeWidth={2.4} />
                    Add Funds
                  </Link>
                  <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-white text-[14px] font-bold text-[#7446D8] shadow-sm">
                    <ArrowLeftRight size={17} strokeWidth={2.4} />
                    Exchange
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 pt-7 md:px-0 md:pt-0">
            <h2 className="text-[15px] font-black text-[#232129] md:text-xl">Quick Start</h2>
            <div className="mt-4 rounded-lg border border-[#E6DAFF] bg-[#FBFAFF] px-4 py-5 md:rounded-3xl md:bg-white md:p-6">
              <div className="grid grid-cols-3 gap-2 md:grid-cols-1 md:gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="flex h-[78px] flex-col items-center justify-center gap-2 rounded-lg border border-[#E9DFFF] bg-[#F4F0FF] text-center md:h-20 md:flex-row md:justify-start md:px-5 md:text-left"
                  >
                    <action.icon size={24} className="text-[#30303A]" />
                    <span className="text-[10px] font-medium leading-tight text-[#25232D] md:text-sm md:font-bold">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="md:mt-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(340px,424px)] md:gap-6">
          <section className="px-5 pt-7 md:px-0 md:pt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-black text-[#232129] md:text-xl">My Meetups</h2>
              <button className="text-[12px] font-semibold text-primary md:text-sm">See All →</button>
            </div>

            <div className="mt-4 flex min-h-[214px] flex-col items-center justify-center rounded-lg border border-[#D9D1EA] bg-[#FBFAFF] px-8 text-center md:min-h-[280px] md:rounded-3xl md:bg-white">
              <WalletCards size={25} className="mb-3 text-[#D6CCE9] md:h-9 md:w-9" />
              <p className="text-[13px] font-black text-[#232129] md:text-lg">No upcoming meetups yet</p>
              <p className="mt-3 text-[12px] font-medium leading-relaxed text-[#656070] md:max-w-md md:text-sm">
                Discover new people and currency exchange opportunities near you.
              </p>
              <button className="mt-6 h-12 rounded-full bg-[#6F3FD7] px-8 text-[14px] font-bold text-white shadow-sm">
                Explore Meetups
              </button>
            </div>
          </section>

          <section className="px-5 pt-5 md:px-0 md:pt-0">
            <div className="relative h-[140px] overflow-hidden rounded-lg bg-[#332A42] md:h-full md:min-h-[280px] md:rounded-3xl">
              <Image
                src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=80"
                alt=""
                fill
                sizes="(min-width: 768px) 380px, 350px"
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white md:bottom-8 md:left-8">
                <p className="text-[14px] font-black md:text-xl">Community Spotlight</p>
                <p className="mt-1 text-[12px] font-medium text-white/90 md:text-sm">
                  How David saved 15% on his last meetup
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}
