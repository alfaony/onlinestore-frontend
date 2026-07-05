'use client'
import Link from 'next/link'
import Logo from '@/components/ui/Logo'

export default function Footer() {
  return (
    <footer style={{ background: '#102b55', paddingTop: 64, paddingBottom: 24 }}>
      <div className="c-app">
        <div className="grid-footer" style={{ marginBottom: 52 }}>

          {/* Brand */}
          <div>
            <Logo size={28} light />
            <p style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(255,255,255,0.45)', marginTop: 12, maxWidth: 240 }}>
              Hidangan khas Palembang autentik, dibuat segar dari resep keluarga untuk meja makan Indonesia.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {['Instagram', 'TikTok', 'YouTube'].map(name => (
                <a key={name} href="#" aria-label={name} style={{
                  width: 32, height: 32,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 7, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize:11, color:'rgba(255,255,255,.65)', fontWeight:700,
                }}>{name.slice(0,2).toUpperCase()}</a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Navigasi</p>
            {[['/', 'Beranda'], ['/menu', 'Produk'], ['/artikel', 'Artikel']].map(([href, label]) => (
              <Link key={href} href={href} style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 8 }}>
                {label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Kontak</p>
            {[['📍', 'Palembang, Sumatera Selatan'], ['📞', '0711-234-567'], ['✉️', 'hello@seraso.id']].map(([ic, t]) => (
              <div key={t} style={{ display: 'flex', gap: 6, marginBottom: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                {ic} {t}
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div>
            <p style={{ color: '#fff', fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Newsletter</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10, lineHeight: 1.6 }}>
              Dapatkan promo eksklusif langsung ke email kamu
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                aria-label="Alamat email untuk newsletter"
                type="email"
                placeholder="Email kamu..."
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: 12, outline: 'none',
                  fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif",
                }}
              />
              <button type="button" className="c-btn c-btn-gold c-btn-sm">Daftar</button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 20, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8,
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>© 2026 Seraso Palembang. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 7, height: 7, background: '#C41E3A', borderRadius: '50%' }} />
            <div style={{ width: 7, height: 7, background: '#fff', borderRadius: '50%' }} />
            <span style={{ fontSize:11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Made with ❤️ in Palembang</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
