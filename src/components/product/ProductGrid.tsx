import type { Branch, Product } from '@/types'
import { MapPin, Store } from 'lucide-react'
import Link from 'next/link'
import ProductCard from './ProductCard'

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

  const productsAvailableAnywhere = products.filter(product => (product.branch_availability?.length ?? 0) > 0)

  if (!productsAvailableAnywhere.length) {
    return (
      <div className="rounded-2xl border border-dashed border-sr-navy/20 bg-white/60 px-5 py-12 text-center py-3">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sr-navy/[0.06] text-2xl" aria-hidden="true">🍽️</div>
        <h3 className="font-display text-2xl font-bold text-sr-navy">Menu sedang belum tersedia</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-sr-gray">Stok produk belum tersedia di cabang mana pun. Silakan coba kembali nanti.</p>
      </div>
    )
  }

  const availableProducts = activeBranch
    ? productsAvailableAnywhere.filter(product => product.available_at_selected_branch)
    : productsAvailableAnywhere
  const productsAvailableElsewhere = activeBranch
    ? productsAvailableAnywhere.filter(product => !product.available_at_selected_branch)
    : []
  const otherProducts = productsAvailableElsewhere

  return (
    <>
      {availableProducts.length > 0 ? (
        <>
          <p className="mb-4 flex items-center gap-1.5 text-xs text-sr-gray">
            <MapPin size={13} aria-hidden="true" />
            {availableProducts.length} menu tersedia di {activeBranch?.name ?? 'semua cabang'}
          </p>
          <div className="grid-products">
            {availableProducts.map(p => <ProductCard key={p.id} product={p} selectedBranch={activeBranch} branches={branches} />)}
          </div>
        </>
      ) : activeBranch ? (
        <div className="rounded-2xl border border-dashed border-sr-navy/20 bg-white/60 px-5 py-8 text-center mb-5 py-3">
          <p className="text-sm font-semibold text-sr-navy">Belum ada menu yang cocok di {activeBranch.name}</p>
          <p className="mt-1 text-xs leading-5 text-sr-gray">
            {otherProducts.length > 0
              ? 'Coba ubah pencarian atau pilih produk dari cabang lain di bawah.'
              : 'Coba ubah pencarian atau pilih cabang lain.'}
          </p>
        </div>
      ) : null}

      {otherProducts.length > 0 && (
        <section className="mt-12 border-t border-sr-cream-dp pt-8" aria-labelledby="other-branch-products-title">
          <div className="mb-6 rounded-2xl border border-sr-navy/10 bg-sr-navy/[0.035] p-4 sm:flex sm:items-start sm:gap-4 sm:p-5">
            <span className="mb-3 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-sr-navy shadow-sm sm:mb-0" aria-hidden="true">
              <Store size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-[.12em] text-sr-red">TERSEDIA DI CABANG LAIN</span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-sr-navy shadow-sm">{otherProducts.length} menu</span>
              </div>
              <h2 id="other-branch-products-title" className="font-display text-[clamp(25px,4vw,34px)] font-bold leading-[1.1] text-sr-navy">
                Menu Seraso lainnya
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-sr-gray">
                Menu berikut belum tersedia di <strong className="font-semibold text-sr-navy">{activeBranch?.name}</strong>.
                {' '}Tekan <strong className="font-semibold text-sr-navy">Pilih cabang</strong> untuk melihat lokasi yang menyediakannya.
              </p>
            </div>
          </div>
          <div className="grid-products">
            {otherProducts.map(p => <ProductCard key={p.id} product={p} selectedBranch={activeBranch} branches={branches} isOtherBranch />)}
          </div>
        </section>
      )}
    </>
  )
}
