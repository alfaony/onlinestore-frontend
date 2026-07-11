import CategoryFilter from '@/components/product/CategoryFilter'
import ProductGrid from '@/components/product/ProductGrid'
import ActiveBranchSync from '@/components/product/ActiveBranchSync'
import api from '@/lib/api'
import type { Metadata } from 'next'
import type { Branch } from '@/types'
import Link from 'next/link'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Pilihan makanan khas Palembang — Pempek, Tekwan, Model, dan masih banyak lagi.',
}
export const revalidate = 300

interface Props {
  searchParams: Promise<{
    category?: string
    search?: string
    sort?: string
    branch_id?: string
  }>
}

async function getData(params: {
  category?: string
  search?: string
  sort?: string
  branch_id?: string
}) {
  try {
    const q = new URLSearchParams({ per_page: '100' })
    if (params.category)  q.set('category', params.category)
    if (params.search)    q.set('search', params.search)
    if (params.sort)      q.set('sort', params.sort)
    if (params.branch_id) {
      q.set('branch_id', params.branch_id)
      q.set('include_other_branches', '1')
    }

    const [p, c, b] = await Promise.all([
      api.get(`/products?${q}`),
      api.get('/categories'),
      api.get('/branches'),
    ])

    const branches     = Array.isArray(b.data) ? b.data : []
    const activeBranch = params.branch_id
      ? branches.find((br: Branch) => br.id === params.branch_id) ?? null
      : null

    return {
      products:      p.data.data ?? [],
      categories:    Array.isArray(c.data) ? c.data : (c.data?.data ?? []),
      meta:          p.data,
      activeBranch,
      branches,
    }
  } catch {
    return { products: [], categories: [], meta: {}, activeBranch: null, branches: [] }
  }
}

export default async function MenuPage({ searchParams }: Props) {
  const params = await searchParams
  const { products, categories, meta, activeBranch, branches } = await getData(params)

  return (
    <div className="c-app section-pad">
      <ActiveBranchSync branch={activeBranch} />

      {/* Branch Banner */}
      {activeBranch && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(27,58,107,0.06)',
          border: '1px solid rgba(27,58,107,0.15)',
          borderRadius: 12, marginBottom: 28,
        }}>
          <p style={{ fontSize: 13, color: '#1B3A6B' }}>
            📍 Menu dari <strong>{activeBranch.name}</strong>
            {activeBranch.operational_status && (
              <span style={{ display:'block', marginTop:4, fontSize:11, color:activeBranch.operational_status.code === 'open' ? '#047857' : '#92600A' }}>
                {activeBranch.operational_status.message}
              </span>
            )}
          </p>
          <Link href="/menu" style={{ fontSize: 11, color: '#C41E3A', fontWeight: 600, textDecoration: 'none' }}>
            Ganti Cabang ×
          </Link>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p className="section-eyebrow" style={{ marginBottom: 10 }}>
          Katalog Produk
        </p>
        <h1 className="section-title" style={{ marginBottom: 12 }}>
          {activeBranch ? `Menu ${activeBranch.name}` : 'Menu Kami'}
        </h1>
        <p className="section-copy">
          Cita rasa asli Palembang, dikirim ke pintu rumahmu
        </p>
      </div>

      {/* Category Filter */}
      <Suspense fallback={
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="c-shimmer" style={{ width: 80, height: 36, borderRadius: 20 }} />
          ))}
        </div>
      }>
        <CategoryFilter
          categories={categories}
          selected={params.category}
          search={params.search}
        />
      </Suspense>

      {/* Product Grid */}
      <ProductGrid products={products} meta={meta} activeBranch={activeBranch} branches={branches} />
    </div>
  )
}
