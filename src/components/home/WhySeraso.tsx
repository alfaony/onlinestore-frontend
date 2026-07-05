import { BadgeCheck, Leaf, ShieldCheck, Truck } from 'lucide-react'

const REASONS = [
  [Leaf, 'Bahan Segar Harian', 'Dipilih dan diolah setiap hari tanpa bahan pengawet.'],
  [BadgeCheck, 'Resep Autentik', 'Rasa khas dari resep keluarga yang dijaga turun-temurun.'],
  [Truck, 'Pengiriman Cepat', 'Diproses dari cabang terdekat agar sampai tetap segar.'],
  [ShieldCheck, 'Pembayaran Aman', 'Transaksi praktis dan terlindungi melalui Midtrans.'],
] as const

export default function WhySeraso() {
  return (
    <section className="section-pad border-y border-sr-navy/10 bg-sr-cream-d">
      <div className="c-app">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="section-eyebrow mb-3">
            Keunggulan Kami
          </p>
          <h2 className="section-title">
            Rasa otentik, layanan modern
          </h2>
          <p className="section-copy mx-auto mt-4">Dari dapur hingga tiba di meja makanmu, setiap detail kami jaga.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(([Icon, title, description]) => (
            <div key={title} className="rounded-2xl border border-sr-navy/10 bg-white/65 p-6 text-left shadow-[0_6px_24px_rgba(27,58,107,0.04)]">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sr-red/10 text-sr-red">
                <Icon size={21} strokeWidth={1.8} />
              </div>
              <h3 className="font-display mb-2 text-xl font-bold text-sr-navy">{title}</h3>
              <p className="text-xs leading-6 text-sr-gray">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
