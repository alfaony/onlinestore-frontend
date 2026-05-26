'use client'
import Link from 'next/link'

export default function AnnouncementBar() {
  return (
    <div className="bg-sr-navy py-2 px-4 flex items-center justify-center gap-3">
      <p className="text-sr-gold-l text-[11px] font-medium">
        🎉 Member baru dapat gratis ongkir untuk pesanan pertama!
      </p>
      <Link
        href="/menu"
        className="text-white border border-white/30 text-[10px] px-2.5 py-0.5 rounded hover:bg-white/10 transition-colors"
      >
        Pesan Sekarang
      </Link>
    </div>
  )
}
