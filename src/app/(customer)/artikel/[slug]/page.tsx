// frontend/src/app/(customer)/artikel/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Calendar, User } from 'lucide-react'

interface Props { params: Promise<{ slug: string }> }

async function getArticle(slug: string) {
    try {
        return await api.get(`/articles/${slug}`).then(r => r.data)
    } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const article = await getArticle(slug)
    if (!article) return { title: 'Artikel tidak ditemukan' }

    return {
        title: article.title,
        description: article.meta_description,
        openGraph: {
            title: article.title,
            description: article.meta_description,
            images: article.image ? [{ url: article.image }] : [],
            type: 'article',
        },
    }
}

export default async function ArtikelDetailPage({ params }: Props) {
    const { slug } = await params
    const article = await getArticle(slug)
    if (!article) notFound()

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        image: article.image,
        datePublished: article.published_at,
        author: { '@type': 'Person', name: article.author?.name ?? 'Seraso Palembang' },
        publisher: { '@type': 'Organization', name: 'Seraso Palembang' },
    }

    return (
        <>
            <script type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <article className="max-w-3xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    {article.category && (
                        <span className="text-xs font-medium text-[--color-accent] uppercase tracking-widest">
                            {article.category.name}
                        </span>
                    )}
                    <h1 className="font-playfair text-4xl font-bold text-gray-900 mt-2 mb-4 leading-tight">
                        {article.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.published_at)}
                        </span>
                        {article.author && (
                            <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {article.author.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Cover Image */}
                {article.image && (
                    <div className="relative h-72 w-full rounded-2xl overflow-hidden mb-8">
                        <Image src={article.image} alt={article.title} fill className="object-cover" />
                    </div>
                )}

                {/* Content */}
                <div
                    className="prose prose-lg max-w-none
            prose-headings:font-playfair prose-headings:text-gray-800
            prose-p:text-gray-600 prose-p:leading-relaxed
            prose-a:text-[--color-primary] prose-img:rounded-xl"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </article>
        </>
    )
}