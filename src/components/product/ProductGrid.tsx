import ProductCard from './ProductCard'
import type { Product } from '@/types'
import Link from 'next/link'

interface Props {
  products: Product[]
  meta?: { total?: number }
}

export default function ProductGrid({ products, meta }: Props) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-sr-navy/20 bg-white/60 px-5 py-16 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-sr-navy/[0.06] text-3xl" aria-hidden="true">🔍</div>
        <h3 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 28, color: '#1B3A6B', marginBottom: 8 }}>
          Tidak ditemukan
        </h3>
        <p className="mx-auto mb-6 max-w-sm text-sm leading-6 text-sr-gray">
          Coba kata kunci lain atau lihat semua menu
        </p>
        <Link href="/menu" className="c-btn c-btn-outline c-btn-sm">
          Tampilkan semua menu
        </Link>
      </div>
    )
  }

  return (
    <>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
        {meta?.total ?? products.length} menu tersedia
      </p>
      <div className="grid-products">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  )
}
