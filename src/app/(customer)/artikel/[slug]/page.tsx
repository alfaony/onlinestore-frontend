import type { Metadata } from 'next'
import { cache } from 'react'
import { isAxiosError } from 'axios'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronRight, User } from 'lucide-react'
import api from '@/lib/api'
import { formatDate, storageUrl } from '@/lib/utils'
import Tag from '@/components/ui/Tag'
import type { Article, ArticleDetailResponse } from '@/types'

interface Props { params: Promise<{ slug: string }> }

const getData = cache(async (slug: string): Promise<ArticleDetailResponse | null> => {
    try {
        return (await api.get<ArticleDetailResponse>(`/articles/${encodeURIComponent(slug)}`)).data
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null
        throw error
    }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const data = await getData(slug)
    if (!data) return { title: 'Artikel tidak ditemukan' }

    const { article } = data
    const imageUrl = article.image ? storageUrl(article.image_url ?? article.image) : undefined

    return {
        title: article.meta_title || article.title,
        description: article.meta_description,
        openGraph: {
            type: 'article',
            title: article.meta_title || article.title,
            description: article.meta_description ?? undefined,
            publishedTime: article.published_at,
            modifiedTime: article.updated_at,
            section: article.category?.name,
            authors: article.author ? [article.author.name] : undefined,
            images: imageUrl ? [{ url: imageUrl, alt: article.title }] : [],
        },
    }
}

export default async function ArtikelDetailPage({ params }: Props) {
    const { slug } = await params
    const data = await getData(slug)
    if (!data) notFound()

    const { article, related } = data
    const imageUrl = article.image ? storageUrl(article.image_url ?? article.image) : undefined
    const categoryHref = article.category
        ? `/artikel?category=${encodeURIComponent(article.category.slug)}`
        : '/artikel'
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.meta_description,
        image: imageUrl,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        articleSection: article.category?.name,
        author: { '@type': 'Person', name: article.author?.name ?? 'Seraso Palembang' },
        publisher: { '@type': 'Organization', name: 'Seraso Palembang' },
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />

            <div className="container-app section-pad">
                <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-xs text-sr-gray">
                    <Link href="/" className="hover:text-sr-red">Beranda</Link>
                    <ChevronRight size={13} aria-hidden="true" />
                    <Link href="/artikel" className="hover:text-sr-red">Artikel</Link>
                    {article.category && (
                        <>
                            <ChevronRight size={13} aria-hidden="true" />
                            <Link href={categoryHref} className="font-semibold text-sr-navy hover:text-sr-red">
                                {article.category.name}
                            </Link>
                        </>
                    )}
                </nav>

                <div className={`grid grid-cols-1 gap-12 ${related.length > 0 ? 'lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]' : ''}`}>
                    <article className={related.length === 0 ? 'mx-auto w-full max-w-3xl' : ''}>
                        {article.category && (
                            <Link href={categoryHref} className="mb-3 inline-flex" aria-label={`Lihat artikel kategori ${article.category.name}`}>
                                <Tag color="gold">{article.category.name}</Tag>
                            </Link>
                        )}

                        <h1 className="font-display mb-4 text-3xl font-bold leading-tight text-sr-dark md:text-[42px]">
                            {article.title}
                        </h1>

                        {article.meta_description && (
                            <p className="mb-5 text-base leading-relaxed text-sr-gray md:text-lg">
                                {article.meta_description}
                            </p>
                        )}

                        <div className="mb-7 flex flex-wrap items-center gap-4 border-b border-sr-navy/10 pb-5 text-sm text-sr-gray">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} aria-hidden="true" /> {formatDate(article.published_at)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <User size={14} aria-hidden="true" /> {article.author?.name ?? 'Tim Seraso'}
                            </span>
                        </div>

                        {imageUrl && (
                            <div className="relative mb-8 h-[240px] overflow-hidden rounded-2xl md:h-[380px]">
                                <Image
                                    src={imageUrl}
                                    alt={article.title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 760px"
                                    className="object-cover"
                                    priority
                                    unoptimized
                                />
                            </div>
                        )}

                        <div
                            className="article-content"
                            dangerouslySetInnerHTML={{ __html: article.content }}
                        />

                        {article.category && (
                            <div className="mt-10 border-t border-sr-navy/10 pt-6">
                                <span className="mr-2 text-sm text-sr-gray">Topik:</span>
                                <Link href={categoryHref} className="text-sm font-bold text-sr-red hover:text-sr-navy">
                                    {article.category.name}
                                </Link>
                            </div>
                        )}
                    </article>

                    {related.length > 0 && (
                        <aside aria-labelledby="related-heading">
                            <div className="rounded-2xl border border-sr-navy/10 bg-white p-5 lg:sticky lg:top-28">
                                <p className="section-eyebrow mb-2">Bacaan selanjutnya</p>
                                <h2 id="related-heading" className="font-display mb-5 text-2xl font-bold text-sr-navy">
                                    {article.category ? `Artikel ${article.category.name} lainnya` : 'Artikel terkait'}
                                </h2>
                                <div className="flex flex-col divide-y divide-sr-navy/10">
                                    {related.map((relatedArticle: Article) => (
                                        <Link
                                            key={relatedArticle.id}
                                            href={`/artikel/${relatedArticle.slug}`}
                                            className="group flex gap-3 py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="relative h-[76px] w-[76px] flex-shrink-0 overflow-hidden rounded-xl bg-sr-cream-d">
                                                {relatedArticle.image
                                                    ? <Image src={storageUrl(relatedArticle.image_url ?? relatedArticle.image)} alt="" fill sizes="76px" className="object-cover" unoptimized />
                                                    : <div className="flex h-full items-center justify-center text-2xl" aria-hidden="true">📰</div>
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-sr-navy group-hover:text-sr-red">
                                                    {relatedArticle.title}
                                                </h3>
                                                <p className="text-[11px] text-gray-400">{formatDate(relatedArticle.published_at)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Link href={categoryHref} className="mt-6 inline-flex text-sm font-bold text-sr-red hover:text-sr-navy">
                                    Lihat semua dalam kategori →
                                </Link>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </>
    )
}
