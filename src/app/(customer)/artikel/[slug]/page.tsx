// src/app/(customer)/artikel/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, User } from 'lucide-react'
import api from '@/lib/api'
import { formatDate, storageUrl } from '@/lib/utils'
import Tag from '@/components/ui/Tag'
import type { Article } from '@/types'

interface Props { params: Promise<{ slug: string }> }

async function getData(slug: string) {
    try { return (await api.get(`/articles/${slug}`)).data } catch { return null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const data = await getData(slug)
    if (!data) return { title: 'Artikel tidak ditemukan' }
    return {
        title: data.article.title,
        description: data.article.meta_description,
        openGraph: { images: data.article.image ? [{ url: data.article.image }] : [] },
    }
}

export default async function ArtikelDetailPage({ params }: Props) {
    const { slug } = await params
    const data = await getData(slug)
    if (!data) notFound()

    const { article, related } = data
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Article',
        headline: article.title, image: article.image,
        datePublished: article.published_at,
        author: { '@type': 'Person', name: article.author?.name ?? 'Seraso Palembang' },
        publisher: { '@type': 'Organization', name: 'Seraso Palembang' },
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <div className={`container-app section-pad grid gap-10
                ${related?.length ? 'grid-cols-1 lg:grid-cols-[2fr_1fr]' : 'grid-cols-1 max-w-2xl'}`}>

                {/* ── Article body ── */}
                <article>
                    {article.category && (
                        <div className="mb-2">
                            <Tag color="gold">{article.category.name}</Tag>
                        </div>
                    )}

                    <h1 className="font-display mt-2.5 mb-4 text-3xl font-bold leading-tight text-sr-dark md:text-[42px]">
                        {article.title}
                    </h1>

                    <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-sr-gray">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} /> {formatDate(article.published_at)}
                        </span>
                        {article.author && (
                            <span className="flex items-center gap-1.5">
                                <User size={14} /> {article.author.name}
                            </span>
                        )}
                    </div>

                    {article.image && (
                        <div className="relative h-[240px] md:h-[320px] rounded-2xl overflow-hidden mb-7">
                            <Image
                                src={storageUrl(article.image)}
                                alt={article.title}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    )}

                    <div
                        className="article-content"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </article>

                {/* ── Related sidebar (desktop only) ── */}
                {related?.length > 0 && (
                    <aside className="hidden lg:block">
                        <h3 className="font-display mb-5 text-2xl font-bold text-sr-navy">
                            Artikel Terkait
                        </h3>
                        <div className="flex flex-col gap-4">
                            {related.map((r: Article) => (
                                <Link key={r.id} href={`/artikel/${r.slug}`} className="flex gap-3">
                                    <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-sr-cream-d">
                                        {r.image
                                            ? <Image src={storageUrl(r.image)} alt={r.title} fill className="object-cover" unoptimized />
                                            : <div className="h-full flex items-center justify-center">📰</div>
                                        }
                                    </div>
                                    <div className="min-w-0">
                                        <p className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-sr-navy">
                                            {r.title}
                                        </p>
                                        <p className="text-[11px] text-gray-400">{formatDate(r.published_at)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </>
    )
}
