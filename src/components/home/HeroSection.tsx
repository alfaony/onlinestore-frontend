import Link from 'next/link'

export default function HeroSection() {
  return (
    <div>
      <section className='bg-sr-navy min-h-[88vh] md:min-h-[82vh] flex items-center relative overflow-hidden'>
        {/* Decorative circles */}
        <div className='absolute -right-5 -top-5 w-80 h-80 bg-sr-red/[0.06] rounded-full pointer-events-none' />
        <div className='absolute right-20 -bottom-10 w-56 h-56 bg-sr-gold/[0.08] rounded-full pointer-events-none' />
        <div className='absolute right-10 top-1/2 -translate-y-1/2 text-[140px] opacity-[0.07] select-none pointer-events-none hidden lg:block'>🌉</div>

        {/* Content */}
        <div className='c-app relative z-10 py-16 md:py-20'>
          <div className='max-w-lg'>

            {/* Badge */}
            <div className='animate-fade-up inline-flex items-center gap-2 bg-sr-gold/15
                          border border-sr-gold/35 rounded-full px-4 py-1.5 mb-5'>
              <span>🌙</span>
              <span className='text-sr-gold-l text-[11px] font-semibold tracking-widest uppercase'>
                AUTENTIK SEJAK DAHULU
              </span>
            </div>

            {/* Headline */}
            <h1 className='animate-fade-up-2 font-display text-5xl md:text-[58px] font-bold text-white
                          leading-[1.08] mb-5'>
              Cita Rasa<br />
              <span className='text-sr-gold'>Palembang</span><br />
              di Rumahmu
            </h1>

            {/* Body */}
            <p className="animate-fade-up-3" style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 15, lineHeight: 1.8,
              marginBottom: 28, maxWidth: 460,
            }}>
              Pempek, Tekwan, Model — dibuat dengan resep turun-temurun dan bahan pilihan
              terbaik, langsung ke pintu rumahmu.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up-3" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/menu" className="c-btn c-btn-gold c-btn-lg">
                Pesan Sekarang →
              </Link>
              <Link href="/artikel" style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '13px 22px', borderRadius: 9,
                color: 'rgba(255,255,255,0.8)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                fontSize: 13, transition: 'all 0.2s',
              }}>
                Tentang Kami
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-up-3" style={{ display: 'flex', gap: 32 }}>
              {[['10+', 'Menu Pilihan'], ['3', 'Cabang'], ['1K+', 'Pelanggan']].map(([n, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: '#E8A020' }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}