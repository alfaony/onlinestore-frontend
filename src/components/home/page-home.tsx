import { Suspense } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import WhySeraso from '@/components/home/WhySeraso'
import BranchSection from '@/components/home/BranchSection'
import LatestArticles from '@/components/home/LatestArticles'
import api from '@/lib/api'

export const metadata: Metadata = {
  title: 'Seraso Palembang — Makanan Khas Palembang Autentik',
  description: 'Pempek, Tekwan, Model dan makanan khas Palembang autentik. Dikirim ke seluruh Indonesia.',
}
export const revalidate = 3600

async function getHomeData() {
  try {
    const [p, b] = await Promise.all([api.get('/products?per_page=6'), api.get('/branches')])
    return { products: p.data.data ?? [], branches: b.data ?? [] }
  } catch {
    return { products: [], branches: [] }
  }
}

export default async function HomePage() {
  const { products, branches } = await getHomeData()

  return (
    <main>
      <HeroSection />
      <FeaturedProducts products={products} />
      <WhySeraso />
      <BranchSection branches={branches} />

      {/* Suspense agar LatestArticles tidak block render */}
      <Suspense fallback={
        <section style={{ padding: '60px 0', background: '#F5EDD9' }}>
          <div className="c-app">
            <div className="grid-products">
              {[1, 2, 3].map(i => <div key={i} className="c-shimmer" style={{ height: 280 }} />)}
            </div>
          </div>
        </section>
      }>
        <LatestArticles />
      </Suspense>

      {/* CTA Banner */}
      <section style={{ background: 'linear-gradient(135deg, #F5EDD9, #EDD9B8)', borderTop: '3px solid #E8A020', padding: '52px 0' }}>
        <div className="c-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 34, fontWeight: 700, color: '#1B3A6B', marginBottom: 6 }}>
              Siap menikmati Palembang?
            </h2>
            <p style={{ color: '#6B7280', fontSize: 14 }}>Pesan sekarang dan rasakan cita rasa autentiknya</p>
          </div>
          <Link href="/menu" className="c-btn c-btn-navy c-btn-lg">
            Pesan Sekarang →
          </Link>
        </div>
      </section>
    </main>
  )
}
