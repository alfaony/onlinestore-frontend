import ProductCard from './ProductCard'
import type { Branch, Product } from '@/types'
import Link from 'next/link'

interface Props {
  products: Product[]
  meta?: { total?: number }
  activeBranch?: Branch | null
  branches?: Branch[]
}

export default function ProductGrid({ products, activeBranch, branches = [] }: Props) {
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

  const availableProducts = activeBranch
    ? products.filter(product => product.available_at_selected_branch)
    : products
  const otherProducts = activeBranch
    ? products.filter(product => !product.available_at_selected_branch && (product.branch_availability?.length ?? 0) > 0)
    : []

  return (
    <>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
        {availableProducts.length} menu tersedia di {activeBranch?.name ?? 'semua cabang'}
      </p>
      <div className="grid-products">
        {availableProducts.map(p => <ProductCard key={p.id} product={p} selectedBranch={activeBranch} branches={branches} />)}
      </div>

      {otherProducts.length > 0 && (
        <section style={{ marginTop:48, paddingTop:32, borderTop:'1px solid #EDD9B8' }}>
          <div style={{ maxWidth:620, marginBottom:20 }}>
            <span style={{ display:'inline-block', fontSize:11, fontWeight:700, letterSpacing:'.08em', color:'#C41E3A', marginBottom:7 }}>JELAJAHI CABANG LAIN</span>
            <h2 style={{ fontFamily:'var(--font-display), Georgia, serif', fontSize:'clamp(25px,4vw,34px)', lineHeight:1.1, color:'#1B3A6B', marginBottom:7 }}>Menu lain yang mungkin kamu suka</h2>
            <p style={{ fontSize:13, lineHeight:1.6, color:'#6B7280' }}>Produk ini belum tersedia di {activeBranch?.name}, tetapi bisa dipesan dari cabang lain. Pilih produk untuk melihat cabang yang menyediakannya.</p>
          </div>
          <div className="grid-products">
            {otherProducts.map(p => <ProductCard key={p.id} product={p} selectedBranch={activeBranch} branches={branches} isOtherBranch />)}
          </div>
        </section>
      )}
    </>
  )
}
