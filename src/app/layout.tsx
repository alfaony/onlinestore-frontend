// src/app/layout.tsx
import type { Metadata } from 'next'
import { bodyFont, displayFont } from '@/lib/fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Seraso Palembang', template: '%s | Seraso Palembang' },
  description: 'Makanan Khas Palembang Autentik',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}
