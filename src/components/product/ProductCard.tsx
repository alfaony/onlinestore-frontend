'use client'
import { formatRupiah, storageUrl, stripHtml } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import type { Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const S = { red: '#C41E3A', navy: '#1B3A6B', gold: '#E8A020', creamD: '#F5EDD9', creamDp: '#EDD9B8', gray: '#6B7280', dark: '#1A1A2E', grayL: '#F3F0EB' }

function Stars({ r }: { r: number }) {
  return <span style={{ color: S.gold, fontSize: 11, letterSpacing: 1 }}>{'★'.repeat(Math.floor(r))}{'☆'.repeat(5 - Math.floor(r))}</span>
}

export default function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const setPendingProduct = useCartStore(s => s.setPendingProduct)

  // Cari semua item produk ini dari berbagai branch
  const totalInCart = useCartStore(s =>
    s.items
      .filter(i => i.id === String(product.id))
      .reduce((sum, i) => sum + i.qty, 0)
  )


  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    // Selalu tampilkan modal branch — user bisa pilih cabang mana
    console.log('Product ID:', product.id) // ← debug dulu
    setPendingProduct(product)
  }

  return (
    <article className="c-card" style={{ cursor: 'pointer' }}>

      {product.popular && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
          <span className="c-tag c-tag-gold">⭐ Terlaris</span>
        </div>
      )}

      {/* Image */}
      <Link href={`/menu/${product.slug}`} style={{ display: 'block' }}>
        <div style={{ height: 168, background: `linear-gradient(145deg,${S.creamD},${S.creamDp})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {product.primary_image?.image_path
            ? <Image src={storageUrl(product.primary_image.image_path)} alt={product.name} fill style={{ objectFit: 'cover' }} unoptimized />
            : <span style={{ fontSize: 64, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>🍜</span>
          }
          {(product.shipping_discounts?.length ?? 0) > 0 && (
            <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
              <span className="c-tag c-tag-red">🏷️ Promo Ongkir</span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span className="c-tag c-tag-navy">{product.category?.name ?? 'Produk'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Stars r={4.8} />
            <span style={{ fontSize: 10, color: S.gray }}>(120)</span>
          </div>
        </div>

        <Link href={`/menu/${product.slug}`}>
          <h3 className="line-clamp-1" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: S.dark, marginBottom: 4, marginTop: 6, lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>

        <p className="line-clamp-2" style={{ fontSize: 11, color: S.gray, marginBottom: 12, lineHeight: 1.6 }}>
          {stripHtml(product.description ?? '')}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 700, color: S.red }}>
              {formatRupiah(Number(product.price))}
            </div>
            <div style={{ fontSize: 10, color: S.gray }}>per porsi</div>
          </div>

          {/* Cart indicator atau tombol pesan */}
          {mounted && totalInCart > 0 ? (
            <button onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(196,30,58,0.08)', border: '1px solid rgba(196,30,58,0.25)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
              <span style={{ fontSize: 12, color: S.red, fontWeight: 700 }}>{totalInCart} ×</span>
              <span style={{ fontSize: 11, color: S.red }}>+ Cabang lain</span>
            </button>
          ) : (
            <button onClick={handleAdd} className="c-btn c-btn-primary c-btn-sm">
              + Pesan
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
