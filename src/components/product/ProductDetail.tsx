'use client'
import { formatRupiah, storageUrl, stripHtml } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import type { Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const S = {
  red:'#C41E3A', redD:'#9B1530', navy:'#1B3A6B',
  gold:'#E8A020', cream:'#FDF8F2', creamD:'#F5EDD9',
  creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB',
  dark:'#1A1A2E', green:'#10B981',
}

function Stars({ r }: { r: number }) {
  return <span style={{ color: S.gold, fontSize: 11, letterSpacing: 1 }}>{'★'.repeat(Math.floor(r))}{'☆'.repeat(5 - Math.floor(r))}</span>
}

export default function ProductDetail({ product }: { product: Product }) {
  const [qty, setQty]       = useState(1)
  const [activeImg, setImg] = useState(0)


  const updateQty         = useCartStore(s => s.updateQty)
  const setPendingProduct = useCartStore(s => s.setPendingProduct)
  const addItem           = useCartStore(s => s.addItem)

  const images = product.images?.length ? product.images : [product.primary_image].filter(Boolean)

  const totalInCart = useCartStore(s =>
    s.items
      .filter(i => i.id === String(product.id))
      .reduce((sum, i) => sum + i.qty, 0)
  )

  function handleAdd() {
    const currentBranch = useCartStore.getState().activeBranch
    if (currentBranch) {
      addItem(product, qty, currentBranch)
    } else {
      setPendingProduct(product)
    }
  }

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60 }}>

      {/* ── Breadcrumb ── */}
      <nav style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, fontSize:12, color:S.gray }}>
        <Link href="/" style={{ color:S.gray }}>Beranda</Link>
        <span>›</span>
        <Link href="/menu" style={{ color:S.gray }}>Menu</Link>
        <span>›</span>
        <span style={{ color:S.navy, fontWeight:500 }}>{product.name}</span>
      </nav>

      {/* ── 2-col grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:48, alignItems:'start', marginBottom:52 }}>

        {/* Images */}
        <div>
          <div style={{ background:`linear-gradient(145deg,${S.creamD},${S.creamDp})`, borderRadius:20, height:340, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden', marginBottom:12 }}>
            {images[activeImg]?.image_path
              ? <Image src={storageUrl(images[activeImg]!.image_path)} alt={product.name} fill style={{ objectFit:'cover' }} unoptimized/>
              : <span style={{ fontSize:100, filter:'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>🍜</span>
            }
            {product.popular && (
              <div style={{ position:'absolute', top:16, right:16 }}>
                <span className="c-tag c-tag-gold">⭐ Terlaris</span>
              </div>
            )}
          </div>
          {/* Thumbnails */}
          <div style={{ display:'flex', gap:8 }}>
            {(images.length ? images : [null,null,null]).slice(0,3).map((img,i) => (
              <button
                key={i}
                onClick={() => setImg(i)}
                aria-label={`Tampilkan gambar ${i + 1} dari ${product.name}`}
                aria-pressed={activeImg === i}
                style={{ flex:1, height:76, borderRadius:12, background:S.creamD, border:`2px solid ${activeImg===i ? S.red : 'transparent'}`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative', cursor:'pointer', transition:'border 0.2s' }}>
                {img?.image_path
                  ? <Image src={storageUrl(img.image_path)} alt="" fill style={{ objectFit:'cover' }} unoptimized/>
                  : <span style={{ fontSize:26 }}>🍜</span>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div style={{ marginBottom:10 }}>
            <span className="c-tag c-tag-navy">{product.category?.name ?? 'Produk'}</span>
          </div>

          <h1 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:'clamp(30px,4vw,38px)', fontWeight:700, color:S.navy, lineHeight:1.2, marginBottom:10 }}>
            {product.name}
          </h1>

          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <Stars r={4.8}/>
            <span style={{ fontSize:13, fontWeight:600 }}>4.8</span>
            <span style={{ fontSize:12, color:S.gray }}>(120 terjual)</span>
          </div>

          <div style={{ marginBottom:16 }}>
            <span style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:34, fontWeight:700, color:S.red }}>
              {formatRupiah(Number(product.price))}
            </span>
            <span style={{ fontSize:14, color:S.gray, marginLeft:8 }}>per porsi</span>
          </div>

          <p style={{ color:S.gray, fontSize:14, lineHeight:1.8, marginBottom:20 }}>
            {stripHtml(product.description ?? '')}
          </p>

          {/* Shipping discount */}
          {(product.shipping_discounts?.length ?? 0) > 0 && (
            <div style={{ background:'rgba(232,160,32,0.1)', border:'1px solid rgba(232,160,32,0.25)', borderRadius:12, padding:14, marginBottom:20 }}>
              <p style={{ color:S.gold, fontWeight:700, fontSize:13, marginBottom:6 }}>🏷️ Promo Diskon Ongkir</p>
              {product.shipping_discounts!.map((d,i) => (
                <p key={i} style={{ fontSize:12, color:'#6b4f00' }}>
                  • Beli {d.min_qty}{d.max_qty ? `–${d.max_qty}` : '+'} pcs → {
                    d.discount_type==='free' ? 'Gratis Ongkir'
                    : d.discount_type==='percent' ? `Diskon ${d.discount_value}%`
                    : `Diskon Rp ${Number(d.discount_value).toLocaleString('id-ID')}`
                  }
                </p>
              ))}
            </div>
          )}

          {/* Qty selector */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <span style={{ fontSize:13, color:S.gray, fontWeight:500 }}>Jumlah:</span>
            <div style={{ display:'flex', alignItems:'center', gap:10, border:`1.5px solid ${S.creamDp}`, borderRadius:10, padding:'8px 16px' }}>
              <button aria-label="Kurangi jumlah" onClick={() => setQty(q => Math.max(1,q-1))} style={{ background:'none', border:'none', color:S.navy, fontSize:18, cursor:'pointer', width:24 }}>−</button>
              <span style={{ fontWeight:600, minWidth:24, textAlign:'center' }}>{qty}</span>
              <button aria-label="Tambah jumlah" onClick={() => setQty(q => q+1)} style={{ background:'none', border:'none', color:S.navy, fontSize:18, cursor:'pointer', width:24 }}>+</button>
            </div>
            <span style={{ fontSize:13, color:S.gray }}>
              = <strong style={{ color:S.red }}>{formatRupiah(Number(product.price)*qty)}</strong>
            </span>
          </div>

          {/* Add button */}
          <button onClick={handleAdd} className={`c-btn c-btn-lg c-btn-full ${totalInCart > 0 ? 'c-btn-success' : 'c-btn-primary'}`} style={{ marginBottom:12 }}>
            {totalInCart > 0 ? `✓ ${totalInCart} di Keranjang — Tambah Lagi` : '🛒  Tambah ke Keranjang'}
          </button>

          {/* Trust badges */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:18 }}>
            {[['🚚','Kirim Cepat'],['🔒','Bayar Aman'],['✅','Segar Terjamin']].map(([ic,t]) => (
              <div key={t} style={{ textAlign:'center', background:S.grayL, borderRadius:10, padding:'12px 6px' }}>
                <div style={{ fontSize:20, marginBottom:5 }}>{ic}</div>
                <div style={{ fontSize:11, color:S.gray, fontWeight:500 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
