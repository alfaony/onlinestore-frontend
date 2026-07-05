// src/app/(customer)/artikel/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { formatDate, storageUrl } from '@/lib/utils'
import Tag from '@/components/ui/Tag'
import type { Article } from '@/types'

export const metadata: Metadata = {
    title: 'Artikel',
    description: 'Tips, resep, dan cerita seputar kuliner khas Palembang.',
}
export const revalidate = 600

export default async function ArtikelPage() {
    let articles: Article[] = []
    try { articles = (await api.get('/articles?per_page=9')).data.data ?? [] } catch { }

    return (
        <div className="c-app section-pad">
            {/* Header */}
            <div className="mb-12 max-w-2xl">
                <div className="section-eyebrow mb-3">
                    Blog &amp; Artikel
                </div>
                <h1 className="section-title">
                    Cerita Palembang
                </h1>
                <p className="section-copy mt-4">Cerita kuliner, resep, dan budaya yang membuat Palembang selalu istimewa.</p>
            </div>

            {articles.length === 0 ? (
                <div className="py-16 text-center text-sr-gray">
                    <div className="text-5xl mb-4">📰</div>
                    <p className="text-sm">Belum ada artikel tersedia.</p>
                </div>
            ) : (
                /* Masonry-style grid: first article spans full width on md+ */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                    {articles.map((a, i) => (
                        <Link
                            key={a.id}
                            href={`/artikel/${a.slug}`}
                            className={`c-card block ${i === 0 ? 'md:col-span-2' : ''}`}
                        >
                            {/* Image */}
                            <div className={`relative overflow-hidden bg-gradient-to-br from-sr-navy to-sr-navy-l
                                ${i === 0 ? 'h-48 md:h-[220px]' : 'h-[160px]'}`}>
                                {a.image
                                    ? <Image src={storageUrl(a.image)} alt={a.title} fill className="object-cover" unoptimized />
                                    : <div className="h-full flex items-center justify-center text-5xl">📰</div>
                                }
                                <div className="absolute top-3.5 left-3.5">
                                    <Tag color="gold">{a.category?.name}</Tag>
                                </div>
                                {i === 0 && (
                                    <div className="absolute top-3.5 right-3.5">
                                        <Tag color="navy">📌 Featured</Tag>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className={i === 0 ? 'p-5 md:p-6' : 'p-4'}>
                                <p className="text-[11px] text-gray-400 mb-1.5">
                                    📅 {formatDate(a.published_at)}
                                </p>
                                <h2 className={`font-display mb-2 font-bold leading-snug text-sr-navy
                                    ${i === 0 ? 'text-xl md:text-[26px]' : 'text-[20px]'}`}>
                                    {a.title}
                                </h2>
                                {a.meta_description && (
                                    <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
                                        {a.meta_description}
                                    </p>
                                )}
                                <span className="text-xs font-bold text-sr-red">
                                    Baca Selengkapnya →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
