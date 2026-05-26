// src/app/(customer)/menu/page.tsx
import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductGrid from '@/components/product/ProductGrid'
import CategoryFilter from '@/components/product/CategoryFilter'
import api from '@/lib/api'
import { toArray } from '@/lib/utils'
import type { Category } from '@/types'


export const metadata: Metadata = { title: 'Menu', description: 'Pilihan makanan khas Palembang.' }
export const revalidate = 300

interface Props { searchParams: Promise<{ category?: string; search?: string; sort?: string }> }

// src/components/product/CategoryFilter.tsx — tambah branch_id ke query
// src/app/(customer)/menu/page.tsx

async function getData(params: {
    category?: string
    search?: string
    sort?: string
    branch_id?: string  // ← tambah
}) {
    try {
        const q = new URLSearchParams({ per_page: '12' })
        if (params.category) q.set('category', params.category)
        if (params.search) q.set('search', params.search)
        if (params.branch_id) q.set('branch_id', params.branch_id)

        const [p, c] = await Promise.all([
            api.get(`/products?${q}`),
            api.get('/categories'),
        ])
        return {
            products: p.data.data ?? p.data ?? [],
            categories: toArray<Category>(c.data),
            meta: p.data,
        }
    } catch {
        return { products: [], categories: [], meta: {} }
    }
}

export default async function MenuPage({ searchParams }: Props) {
    const params = await searchParams
    const { products, categories, meta } = await getData(params)

    return (
        <div className="c-app py-11 md:py-1 mt-5 mt-5" style={{ paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', zIndex: 1 }}>
            <div className="mb-7">
                <div className="text-gold text-[10px] font-bold tracking-[3px] mb-1.5 uppercase">
                    Katalog Produk
                </div>
                <h1 className="font-display text-4xl md:text-[46px] font-bold text-navy mb-2">
                    Menu Kami
                </h1>
                <p className="text-gray-brand text-sm">Cita rasa asli Palembang, dikirim ke pintu rumahmu</p>
            </div>

            <Suspense fallback={<div className="h-20" />}>
                <CategoryFilter categories={categories} selected={params.category} search={params.search} />
            </Suspense>

            <main className="flex-1">
                <ProductGrid products={products} meta={meta} />
            </main>
        </div>
    )
}