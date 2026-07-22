'use client'

import api from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/types'
import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function FeaturedProducts({ initialProducts }: { initialProducts: Product[] }) {
  const activeBranch = useCartStore(state => state.activeBranch)
  const hasHydrated = useCartStore(state => state.hasHydrated)
  const [branchResult, setBranchResult] = useState<{
    branchId: string
    products: Product[]
  } | null>(null)
  const activeBranchId = hasHydrated ? activeBranch?.id ?? null : null
  const usesBranchRanking = activeBranchId !== null
  const hasCurrentBranchResult = usesBranchRanking && branchResult?.branchId === activeBranchId
  const loading = usesBranchRanking && !hasCurrentBranchResult
  const products = usesBranchRanking
    ? hasCurrentBranchResult ? branchResult.products : []
    : initialProducts

  useEffect(() => {
    if (!activeBranchId) return

    let active = true
    const branchId = activeBranchId

    api.get('/products/best-sellers', {
      params: { branch_id: branchId, limit: 6 },
    })
      .then(({ data }) => {
        if (active) {
          setBranchResult({
            branchId,
            products: Array.isArray(data.data) ? data.data : [],
          })
        }
      })
      .catch(() => {
        if (active) setBranchResult({ branchId, products: [] })
      })

    return () => { active = false }
  }, [activeBranchId])

  if (!usesBranchRanking && products.length === 0 && !loading) return null

  return (
    <section className="c-app section-pad">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="section-eyebrow mb-3">
            Pilihan Terbaik
          </p>
          <h2 className="section-title">
            Menu Unggulan
          </h2>
          <p className="section-copy mt-3">
            {activeBranch
              ? `Paling banyak dipesan dari ${activeBranch.name}.`
              : 'Paling banyak dipesan pelanggan dari seluruh cabang.'}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {loading && <LoaderCircle size={17} className="animate-spin text-sr-gray" aria-label="Memuat menu terlaris cabang" />}
          <Link href={activeBranch ? `/menu?branch_id=${activeBranch.id}` : '/menu'} className="c-btn c-btn-outline c-btn-sm">
            Lihat Semua →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {loading
          ? [1, 2, 3].map(item => (
              <div key={item} className="c-shimmer min-h-80 rounded-2xl" aria-hidden="true" />
            ))
          : products.length === 0
            ? (
                <div className="col-span-full rounded-2xl border border-dashed border-sr-navy/20 bg-white/60 px-5 py-10 text-center">
                  <p className="font-display text-xl font-bold text-sr-navy">Belum ada data menu terlaris</p>
                  <p className="mt-2 text-sm text-sr-gray">Belum ada penjualan valid di {activeBranch?.name}.</p>
                </div>
              )
          : products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
      </div>

      {/* Mobile CTA */}
      <div className="mt-6 sm:hidden">
        <Link href={activeBranch ? `/menu?branch_id=${activeBranch.id}` : '/menu'} className="c-btn c-btn-primary c-btn-lg c-btn-full">
          Lihat Semua Menu →
        </Link>
      </div>
    </section>
  )
}
