import './globals.css'
import { ReactNode } from 'react'

export const metadata = { title: 'Hi-DORRI', description: 'Meet & Connect' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}