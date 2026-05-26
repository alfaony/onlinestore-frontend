const REASONS = [
  ['🌿', 'Bahan Segar Harian', 'Dipilih setiap hari, tanpa pengawet'],
  ['⭐', 'Resep Autentik',     'Turun-temurun puluhan tahun'],
  ['🚀', 'Pengiriman Cepat',  'Dikirim segera agar tetap segar'],
  ['🔒', 'Bayar Aman',        'Dilindungi Midtrans & SSL'],
] as const

export default function WhySeraso() {
  return (
    <section className="bg-sr-red py-14 md:py-16">
      <div className="c-app">
        <div className="text-center mb-10">
          <p className="text-white/50 text-[10px] font-bold tracking-[3px] uppercase mb-2">
            Keunggulan Kami
          </p>
          <h2 className="font-display text-[38px] font-bold text-white">
            Mengapa Memilih Seraso?
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {REASONS.map(([ic, t, d]) => (
            <div key={t} className="text-center">
              <div className="w-14 h-14 bg-white/[0.12] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                {ic}
              </div>
              <h3 className="font-display text-[17px] font-semibold text-white mb-1.5">{t}</h3>
              <p className="text-white/[0.58] text-xs leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
