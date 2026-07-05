'use client'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function AnnouncementBar() {
  return (
    <div className="flex min-h-8 items-center justify-center gap-2.5 bg-sr-navy px-4 py-1.5">
      <Sparkles size={12} className="shrink-0 text-sr-gold-l" aria-hidden="true" />
      <p className="text-center text-xs font-semibold tracking-[0.02em] text-white/80">
        Gratis ongkir untuk pesanan pertamamu
      </p>
      <Link
        href="/menu"
        className="hidden items-center gap-1 text-xs font-bold text-sr-gold-l transition-colors hover:text-white min-[390px]:inline-flex"
      >
        Pesan sekarang <ArrowRight size={11} />
      </Link>
    </div>
  )
}
