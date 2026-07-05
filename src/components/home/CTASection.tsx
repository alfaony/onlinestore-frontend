import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="bg-sr-red py-12 md:py-14">
      <div className="c-app flex flex-col items-start justify-between gap-7 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-white/55">Pesan hari ini</p>
          <h2 className="font-display mb-2 text-[34px] font-bold leading-tight text-white md:text-[40px]">
            Siap menikmati Palembang?
          </h2>
          <p className="text-sm leading-6 text-white/65">
            Pilih menu favoritmu, kami siapkan dari cabang terdekat.
          </p>
        </div>
        <Link href="/menu" className="c-btn c-btn-lg whitespace-nowrap bg-white text-sr-red shadow-lg hover:-translate-y-0.5 hover:bg-sr-cream">
          Lihat Menu <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  )
}
