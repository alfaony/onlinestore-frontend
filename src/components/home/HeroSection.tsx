import BranchSelector from './BranchSelector'
import { BadgeCheck } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="hero-shell">
      <div className="c-app hero-grid">
          <div>
            <div className="hero-kicker animate-fade-up">
              <BadgeCheck size={14} aria-hidden="true" />
              <span>RESEP ASLI PALEMBANG</span>
            </div>

            <h1 className="hero-title animate-fade-up-2">
              Cita rasa <span className="text-sr-gold">Palembang</span>, di rumahmu.
            </h1>

            <p className="hero-copy animate-fade-up-3">
              Pempek, tekwan, dan hidangan khas lainnya dibuat segar setiap hari, lalu dikirim langsung dari cabang terdekat.
            </p>

            <div className="hero-stats animate-fade-up-3">
              {[['10+','Pilihan menu'],['3','Cabang'],['1K+','Pelanggan']].map(([number,label]) => (
                <div className="hero-stat" key={label}>
                  <div className="font-display text-3xl font-bold text-sr-gold">{number}</div>
                  <div className="mt-1 text-xs text-white/55">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up-2">
            <div className="hero-selector-card">
              <p className="hero-selector-title">Pilih cabang terdekat untuk mulai memesan</p>
              <BranchSelector/>
            </div>
          </div>
      </div>
    </section>
  )
}
