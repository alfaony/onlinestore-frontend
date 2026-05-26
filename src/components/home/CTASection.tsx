import Link from 'next/link'

export default function CTASection() {
  return (
    <section className="bg-gradient-to-br from-sr-cream-d to-sr-cream-dp border-t-4 border-sr-gold py-14">
      <div className="c-app flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="font-display text-[34px] font-bold text-sr-navy mb-1.5">
            Siap menikmati Palembang?
          </h2>
          <p className="text-sr-gray text-sm">
            Pesan sekarang dan rasakan cita rasa autentiknya
          </p>
        </div>
        <Link href="/menu" className="c-btn c-btn-navy c-btn-lg whitespace-nowrap">
          Pesan Sekarang →
        </Link>
      </div>
    </section>
  )
}
