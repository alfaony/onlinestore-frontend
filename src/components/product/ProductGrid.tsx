import ProductCard from './ProductCard'
import type { Product } from '@/types'

interface Props { products: Product[]; meta?: any }

export default function ProductGrid({ products, meta }: Props) {
  if (!products.length) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>🔍</div>
        <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: '#1B3A6B', marginBottom: 8 }}>
          Tidak ditemukan
        </h3>
        <p style={{ fontSize: 13, color: '#6B7280' }}>
          Coba kata kunci lain atau lihat semua menu
        </p>
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