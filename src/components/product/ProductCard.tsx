'use client'
import { formatRupiah, storageUrl, stripHtml } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import type { Branch, Product } from '@/types'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Plus, ShoppingBag, Store } from 'lucide-react'

const S = { red: '#C41E3A', creamD: '#F5EDD9', creamDp: '#EDD9B8', gray: '#6B7280', dark: '#1A1A2E' }

export default function ProductCard({ product, selectedBranch, branches = [], isOtherBranch = false }: {
  product: Product
  selectedBranch?: Branch | null
  branches?: Branch[]
  isOtherBranch?: boolean
}) {
  const setPendingProduct = useCartStore(s => s.setPendingProduct)
  const activeBranch = useCartStore(s => s.activeBranch)
  const addItem           = useCartStore(s => s.addItem)
  const hasHydrated       = useCartStore(s => s.hasHydrated)

  const effectiveBranch = selectedBranch !== undefined ? selectedBranch : activeBranch
  const availableBranchIds = product.branch_availability ?? []
  const canChooseOtherBranch = availableBranchIds.length > 0
  const isAvailable = !effectiveBranch || availableBranchIds.includes(effectiveBranch.id)
  const availableBranchNames = branches
    .filter(branch => availableBranchIds.includes(branch.id))
    .map(branch => branch.name)
  const branchLabel = availableBranchNames.length > 2
    ? `${availableBranchNames.slice(0, 2).join(', ')} +${availableBranchNames.length - 2}`
    : availableBranchNames.join(', ')
  const branchPrices = Object.values(product.branch_prices ?? {}).map(Number).filter(Number.isFinite)
  const displayPrice = isOtherBranch && branchPrices.length > 0
    ? Math.min(...branchPrices)
    : Number(product.price)
  const primaryImage = product.primary_image ?? product.images?.[0]
  const operational = selectedBranch?.operational_status
  const availabilityLabel = operational && operational.code !== 'open' && operational.accepting_orders
    ? 'Pesanan terjadwal'
    : 'Siap dipesan'


  const totalInCart = useCartStore(s =>
    s.items
      .filter(i => i.id === String(product.id))
      .reduce((sum, i) => sum + i.qty, 0)
  )

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    // Halaman menu mengirim branch secara langsung agar klik tidak terkena
    // state Zustand lama pada render pertama setelah berpindah cabang.
    const currentBranch = selectedBranch !== undefined
      ? selectedBranch
      : useCartStore.getState().activeBranch

    if (!isAvailable) {
      // Produk yang tersedia di cabang lain dapat langsung memilih cabang.
      if (canChooseOtherBranch) setPendingProduct(product)
      return
    }

    if (currentBranch) {
      addItem(product, 1, currentBranch)
    } else {
      setPendingProduct(product)
    }
  }

  return (
    <article className="c-card product-card" style={isOtherBranch ? { borderColor:'rgba(27,58,107,.18)', background:'#FCFBF8' } : undefined}>

      {product.is_best_seller && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
          <span className="c-tag c-tag-gold">Terlaris</span>
        </div>
      )}

      {/* Image */}
      <Link href={`/menu/${product.slug}`} className="block overflow-hidden" aria-label={`Lihat ${product.name}`}>
        <div className="product-card__media" style={{ background: `linear-gradient(145deg,${S.creamD},${S.creamDp})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          {primaryImage?.image_path
            ? <Image src={storageUrl(primaryImage.image_url ?? primaryImage.image_path)} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} unoptimized />
            : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/50 text-5xl shadow-sm">🍜</div>
          }
          {(product.shipping_discounts?.length ?? 0) > 0 && (
            <div style={{ position: 'absolute', bottom: 10, left: 10 }}>
              <span className="c-tag c-tag-red">Promo Ongkir</span>
            </div>
          )}
          {isOtherBranch && (
            <span className="absolute left-2.5 top-2.5 rounded-full border border-white/80 bg-white/95 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-sr-navy shadow-sm">
              CABANG LAIN
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="product-card__body">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="c-tag c-tag-navy">{product.category?.name ?? 'Produk'}</span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-sr-gray">
            <MapPin size={10} /> {isOtherBranch
              ? canChooseOtherBranch ? `${availableBranchNames.length || availableBranchIds.length} cabang` : 'Belum tersedia'
              : availabilityLabel}
          </span>
        </div>

        <Link href={`/menu/${product.slug}`}>
          <h3 className="line-clamp-1 transition-colors hover:text-sr-red" style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 21, fontWeight: 700, color: S.dark, marginBottom: 6, marginTop: 6, lineHeight: 1.3 }}>
            {product.name}
          </h3>
        </Link>

        <p className="line-clamp-2" style={{ fontSize: 12, color: S.gray, marginBottom: 18, lineHeight: 1.65 }}>
          {stripHtml(product.description ?? '')}
        </p>

        {isOtherBranch && (
          <div className="mb-4 flex gap-2.5 rounded-xl border border-sr-navy/10 bg-sr-navy/[0.04] p-3">
            <Store size={16} className="mt-0.5 shrink-0 text-sr-navy" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-4 text-sr-navy">
                {canChooseOtherBranch ? `Belum tersedia di ${effectiveBranch?.name}` : 'Belum tersedia untuk dipesan'}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-sr-gray">
                {canChooseOtherBranch ? `Tersedia di ${branchLabel || 'cabang Seraso lainnya'}` : 'Produk ada di katalog, tetapi belum tersedia di cabang mana pun.'}
              </p>
            </div>
          </div>
        )}

        {/* Price + Action */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-sr-navy/10 pt-4">
          <div>
            <div style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:22, lineHeight:1, fontWeight:700, color:S.red }}>
              {isOtherBranch && canChooseOtherBranch && <span className="mb-1 block font-sans text-[10px] font-semibold uppercase tracking-wide text-sr-gray">Mulai dari</span>}
              {formatRupiah(displayPrice)}
            </div>
            <div className="mt-1 text-[11px] text-sr-gray">per porsi</div>
          </div>

          {hasHydrated && !isAvailable && canChooseOtherBranch ? (
            // ❌ Tidak tersedia di branch aktif
            <button onClick={handleAdd} className="c-btn c-btn-outline c-btn-sm" aria-label={`Pilih cabang untuk ${product.name}`}>
              <MapPin size={13} /> Pilih cabang
            </button>
          ) : hasHydrated && !isAvailable ? (
            <span className="inline-flex min-h-9 items-center rounded-lg bg-sr-gray/10 px-3 text-[11px] font-bold text-sr-gray">
              Belum tersedia
            </span>
          ) : hasHydrated && totalInCart > 0 ? (
            <button onClick={handleAdd} aria-label={`Tambah ${product.name}`} style={{ display:'flex', minHeight:38, alignItems:'center', gap:6, background:'rgba(196,30,58,0.08)', border:'1px solid rgba(196,30,58,0.25)', borderRadius:10, padding:'6px 10px', cursor:'pointer' }}>
              <span style={{ fontSize:12, color:S.red, fontWeight:700 }}>{totalInCart} ×</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-sr-red"><Plus size={12} /> Tambah</span>
            </button>
          ) : (
            <button onClick={handleAdd} aria-label={`Pesan ${product.name}`} className="c-btn c-btn-primary c-btn-sm">
              <ShoppingBag size={14} /> Pesan
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
