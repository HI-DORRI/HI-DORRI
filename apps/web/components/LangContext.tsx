'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'KOR' | 'ENG'

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
}>({ lang: 'KOR', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('KOR')

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const saved = localStorage.getItem('lang') as Lang | null
      if (saved === 'KOR' || saved === 'ENG') {
        setLangState(saved)
      }
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
