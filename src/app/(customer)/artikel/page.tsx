// frontend/src/app/(customer)/artikel/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import api from '@/lib/api'
import { Article } from '@/types'
import { formatDate } from '@/lib/utils'
import { Calendar } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Artikel',
    description: 'Tips, resep, dan cerita seputar kuliner khas Palembang dari Seraso.',
}

export const revalidate = 600

export default async function ArtikelPage() {
    const { data: articles } = await api.get('/articles').then(r => r.data)

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="mb-10">
                <h1 className="font-playfair text-4xl font-bold text-[--color-primary] mb-2">Artikel</h1>
                <p className="text-[--color-warm-gray]">Cerita dan tips seputar kuliner Palembang</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles?.map((article: Article) => (
                    <Link key={article.id} href={`/artikel/${article.slug}`}
                        className="group bg-white rounded-2xl overflow-hidden shadow-sm
              border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="relative h-48 w-full bg-amber-50">
                            {article.image ? (
                                <Image src={article.image} alt={article.title}
                                    fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="h-full flex items-center justify-center text-5xl">📰</div>
                            )}
                        </div>
                        <div className="p-5">
                            {article.category && (
                                <span className="text-xs font-medium text-[--color-accent] uppercase tracking-wide">
                                    {article.category.name}
                                </span>
                            )}
                            <h2 className="font-playfair font-bold text-gray-800 mt-1 mb-2 line-clamp-2
                group-hover:text-[--color-primary] transition-colors">
                                {article.title}
                            </h2>
                            {article.meta_description && (
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.meta_description}</p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                {formatDate(article.published_at)}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}