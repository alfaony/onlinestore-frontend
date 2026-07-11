'use client'
import Logo from '@/components/ui/Logo'
import Link from 'next/link'

const NAV_LINKS = [['/', 'Beranda'], ['/menu', 'Produk'], ['/artikel', 'Artikel']] as const
const CONTACTS = [
  ['📍', 'Palembang, Sumatera Selatan'],
  ['📞', '+62821-3695-9786'],
  ['✉️', 'serasopalembang@gmail.com'],
] as const
const SOCIAL = ['📘', '📷', '🐦', '▶️'] as const

export default function Footer() {
  return (
    <footer className="bg-sr-navy pt-12 pb-6">
      <div className="c-app">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.5fr] gap-8 mb-10">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo height={76} variant="footer-dark" />
            <p className="text-xs text-white/45 leading-relaxed mt-3 max-w-[240px]">
              Makanan khas Palembang autentik dengan resep turun-temurun yang telah menemani keluarga Indonesia.
            </p>
            <div className="flex gap-2 mt-4">
              {SOCIAL.map(ic => (
                <div
                  key={ic}
                  className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-white/20 transition-colors"
                >
                  {ic}
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <p className="text-white font-semibold text-[13px] mb-3">Navigasi</p>
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="block text-white/45 text-xs mb-2 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold text-[13px] mb-3">Kontak</p>
            {CONTACTS.map(([ic, t]) => (
              <div key={t} className="flex gap-1.5 text-xs text-white/45 mb-2">
                {ic} {t}
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p className="text-white font-semibold text-[13px] mb-2">Newsletter</p>
            <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
              Dapatkan promo eksklusif langsung ke email kamu
            </p>
            <div className="flex gap-1.5">
              <input
                placeholder="Email kamu..."
                className="flex-1 px-3 py-2 rounded-lg border border-white/15 bg-white/[0.08] text-white text-xs placeholder:text-white/30 outline-none focus:border-sr-gold transition-colors"
              />
              <button className="bg-sr-gold text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors border-0 cursor-pointer hover:opacity-90">
                Daftar
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[11px] text-white/30">© 2026 Seraso Palembang. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-sr-red rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-[10px] text-white/30 ml-1">Made with ❤️ in Palembang</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
