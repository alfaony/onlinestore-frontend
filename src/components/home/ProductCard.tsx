'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart.store'
import { formatRupiah, storageUrl, stripHtml } from '@/lib/utils'
import type { Product } from '@/types'

export default function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const cartItem          = useCartStore(s => s.items.find(i => i.id === product.id))
  const updateQty         = useCartStore(s => s.updateQty)
  const setPendingProduct = useCartStore(s => s.setPendingProduct)
  const branchId          = useCartStore(s => s.branchId)
  const addItem           = useCartStore(s => s.addItem)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    if (!branchId) setPendingProduct(product)
    else addItem(product, 1, branchId)
  }

  const stars = (r: number) => '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r))

  return (
    <article className="c-card" style={{ cursor: 'pointer' }}>

      {/* Terlaris badge */}
      {product.popular && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
          <span className="c-tag c-tag-gold">⭐ Terlaris</span>
        </div>
      )}

      {/* Image */}
      <Link href={`/menu/${product.slug}`} style={{ display: 'block' }}>
        <div style={{
          height: 168,
          background: 'linear-gradient(145deg, #F5EDD9, #EDD9B8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {product.primary_image?.image_path
            ? <Image src={storageUrl(product.primary_image.image_path)} alt={product.name}
                     fill style={{ objectFit: 'cover' }} unoptimized />
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
            <span className="c-stars">{stars(4.8)}</span>
            <span style={{ fontSize: 10, color: '#6B7280' }}>(120)</span>
          </div>
        </div>

        <Link href={`/menu/${product.slug}`}>
          <h3 className="line-clamp-1" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18, fontWeight: 600, color: '#1A1A2E',
            marginBottom: 4, marginTop: 6, lineHeight: 1.3,
          }}>{product.name}</h3>
        </Link>

        <p className="line-clamp-2" style={{ fontSize: 11, color: '#6B7280', marginBottom: 12, lineHeight: 1.6 }}>
          {stripHtml(product.description ?? '')}
        </p>

        {/* Price + Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 700, color: '#C41E3A' }}>
              {formatRupiah(Number(product.price))}
            </div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>per porsi</div>
          </div>

          {mounted && cartItem ? (
            <div onClick={e => e.preventDefault()} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(196,30,58,0.08)',
              border: '1px solid rgba(196,30,58,0.2)',
              borderRadius: 8, padding: '5px 10px',
            }}>
              <button onClick={() => updateQty(product.id, cartItem.qty - 1)} style={{ background: 'none', border: 'none', color: '#C41E3A', fontSize: 16, fontWeight: 700, width: 20, cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#C41E3A', minWidth: 18, textAlign: 'center' }}>{cartItem.qty}</span>
              <button onClick={() => updateQty(product.id, cartItem.qty + 1)} style={{ background: 'none', border: 'none', color: '#C41E3A', fontSize: 16, fontWeight: 700, width: 20, cursor: 'pointer' }}>+</button>
            </div>
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
