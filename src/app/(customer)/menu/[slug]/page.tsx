// src/app/(customer)/menu/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProductDetail from '@/components/product/ProductDetail'
import api from '@/lib/api'
import type { Product } from '@/types'

interface Props { params: Promise<{ slug: string }> }

async function getProduct(slug: string): Promise<Product | null> {
    try { return (await api.get(`/products/${slug}`)).data } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const product = await getProduct(slug)
    if (!product) return { title: 'Produk tidak ditemukan' }
    return {
        title: product.name,
        description: product.description?.slice(0, 160),
        openGraph: { title: `${product.name} | Seraso Palembang`, images: product.primary_image ? [{ url: product.primary_image.image_path }] : [] },
    }
}

export default async function ProductDetailPage({ params }: Props) {
    const { slug } = await params
    const product = await getProduct(slug)
    if (!product) notFound()

    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Product',
        name: product.name, description: product.description,
        image: product.primary_image?.image_path,
        offers: { '@type': 'Offer', price: product.price, priceCurrency: 'IDR', availability: 'https://schema.org/InStock' },
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <ProductDetail product={product} />
        </>
    )
}