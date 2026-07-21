import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { formatDate, storageUrl } from '@/lib/utils'
import Tag from '@/components/ui/Tag'
import type { Article, ArticleCategory } from '@/types'

export const metadata: Metadata = {
    title: 'Artikel',
    description: 'Tips, resep, dan cerita seputar kuliner khas Palembang.',
}
export const revalidate = 600

interface Props {
    searchParams: Promise<{ category?: string | string[] }>
}

async function getArticles(category?: string): Promise<Article[]> {
    try {
        const response = await api.get('/articles', {
            params: { per_page: 9, ...(category ? { category } : {}) },
        })
        return response.data.data ?? []
    } catch {
        return []
    }
}

async function getCategories(): Promise<ArticleCategory[]> {
    try { return (await api.get('/article-categories')).data ?? [] } catch { return [] }
}

export default async function ArtikelPage({ searchParams }: Props) {
    const params = await searchParams
    const categorySlug = typeof params.category === 'string' ? params.category : undefined
    const [articles, categories] = await Promise.all([
        getArticles(categorySlug),
        getCategories(),
    ])
    const activeCategory = categories.find((category) => category.slug === categorySlug)

    return (
        <div className="c-app section-pad">
            <div className="mb-8 max-w-2xl">
                <div className="section-eyebrow mb-3">Blog &amp; Artikel</div>
                <h1 className="section-title">
                    {activeCategory ? activeCategory.name : 'Cerita Palembang'}
                </h1>
                <p className="section-copy mt-4">
                    {activeCategory
                        ? `Artikel pilihan dalam kategori ${activeCategory.name}.`
                        : 'Cerita kuliner, resep, dan budaya yang membuat Palembang selalu istimewa.'}
                </p>
            </div>

            {categories.length > 0 && (
                <nav aria-label="Kategori artikel" className="mb-10 flex flex-wrap gap-2">
                    <Link
                        href="/artikel"
                        aria-current={!categorySlug ? 'page' : undefined}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                            !categorySlug
                                ? 'border-sr-navy bg-sr-navy text-white'
                                : 'border-sr-navy/10 bg-white text-sr-navy hover:border-sr-red hover:text-sr-red'
                        }`}
                    >
                        Semua
                    </Link>
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={`/artikel?category=${encodeURIComponent(category.slug)}`}
                            aria-current={category.slug === categorySlug ? 'page' : undefined}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                                category.slug === categorySlug
                                    ? 'border-sr-navy bg-sr-navy text-white'
                                    : 'border-sr-navy/10 bg-white text-sr-navy hover:border-sr-red hover:text-sr-red'
                            }`}
                        >
                            {category.name}
                            {typeof category.articles_count === 'number' && (
                                <span className="ml-1.5 opacity-60">{category.articles_count}</span>
                            )}
                        </Link>
                    ))}
                </nav>
            )}

            {articles.length === 0 ? (
                <div className="rounded-2xl border border-sr-navy/10 bg-white px-6 py-16 text-center text-sr-gray">
                    <div className="mb-4 text-5xl" aria-hidden="true">📰</div>
                    <p className="font-semibold text-sr-navy">
                        {activeCategory ? `Belum ada artikel dalam kategori ${activeCategory.name}.` : 'Belum ada artikel tersedia.'}
                    </p>
                    {categorySlug && (
                        <Link href="/artikel" className="mt-4 inline-block text-sm font-bold text-sr-red">
                            Lihat semua artikel →
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                    {articles.map((article, index) => (
                        <Link
                            key={article.id}
                            href={`/artikel/${article.slug}`}
                            className={`c-card block ${index === 0 ? 'md:col-span-2' : ''}`}
                        >
                            <div className={`relative overflow-hidden bg-gradient-to-br from-sr-navy to-sr-navy-l ${
                                index === 0 ? 'h-48 md:h-[220px]' : 'h-[160px]'
                            }`}>
                                {article.image
                                    ? <Image src={storageUrl(article.image_url ?? article.image)} alt={article.title} fill className="object-cover" unoptimized />
                                    : <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">📰</div>
                                }
                                {article.category && (
                                    <div className="absolute left-3.5 top-3.5">
                                        <Tag color="gold">{article.category.name}</Tag>
                                    </div>
                                )}
                                {index === 0 && (
                                    <div className="absolute right-3.5 top-3.5">
                                        <Tag color="navy">Pilihan terbaru</Tag>
                                    </div>
                                )}
                            </div>

                            <div className={index === 0 ? 'p-5 md:p-6' : 'p-4'}>
                                <p className="mb-1.5 text-[11px] text-gray-400">
                                    {formatDate(article.published_at)}
                                </p>
                                <h2 className={`font-display mb-2 font-bold leading-snug text-sr-navy ${
                                    index === 0 ? 'text-xl md:text-[26px]' : 'text-[20px]'
                                }`}>
                                    {article.title}
                                </h2>
                                {article.meta_description && (
                                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-400">
                                        {article.meta_description}
                                    </p>
                                )}
                                <span className="text-xs font-bold text-sr-red">Baca selengkapnya →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
