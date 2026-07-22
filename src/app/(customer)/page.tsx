import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import WhySeraso from '@/components/home/WhySeraso'
import BranchSection from '@/components/home/BranchSection'
import CTASection from '@/components/home/CTASection'
import LatestArticles from '@/components/home/LatestArticles'
import api from '@/lib/api'
import type { Branch, Product } from '@/types'

// Article mutations normally invalidate this route on demand. A short fallback
// lets the homepage recover quickly if the revalidation callback is unavailable.
export const revalidate = 60

async function getFeaturedProducts(): Promise<Product[]> {
    try {
        const { data } = await api.get('/products/best-sellers?limit=6')

        return Array.isArray(data.data) ? data.data : []
    } catch {
        return []
    }
}

async function getBranches(): Promise<Branch[]> {
    try {
        return (await api.get('/branches')).data ?? []
    } catch {
        return []
    }
}

export default async function HomePage() {
    const [products, branches] = await Promise.all([
        getFeaturedProducts(),
        getBranches(),
    ])

    return (
        <>
            <HeroSection />
            <FeaturedProducts initialProducts={products} />
            <WhySeraso />
            <BranchSection branches={branches} />
            <Suspense fallback={
                <section className="bg-sr-cream-d border-t-4 border-sr-gold py-14">
                    <div className="c-app">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="c-shimmer rounded-2xl" style={{ height: 280 }} />
                            ))}
                        </div>
                    </div>
                </section>
            }>
                <LatestArticles />
            </Suspense>
            <CTASection />
        </>
    )
}
