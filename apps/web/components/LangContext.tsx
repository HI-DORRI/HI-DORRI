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
    const saved = localStorage.getItem('lang') as Lang
    if (saved) setLangState(saved)
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