import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Newspaper } from 'lucide-react'
import api from '@/lib/api'
import { formatDate, storageUrl } from '@/lib/utils'
import ArticleMedia from '@/components/article/ArticleMedia'
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

interface ArticleListResult {
    articles: Article[]
    unavailable: boolean
}

async function getArticles(category?: string): Promise<ArticleListResult> {
    try {
        const response = await api.get('/articles', {
            params: { per_page: 9, ...(category ? { category } : {}) },
        })
        return { articles: response.data.data ?? [], unavailable: false }
    } catch {
        return { articles: [], unavailable: true }
    }
}

async function getCategories(): Promise<ArticleCategory[]> {
    try { return (await api.get('/article-categories')).data ?? [] } catch { return [] }
}

export default async function ArtikelPage({ searchParams }: Props) {
    const params = await searchParams
    const categorySlug = typeof params.category === 'string' ? params.category : undefined
    const [articleResult, categories] = await Promise.all([
        getArticles(categorySlug),
        getCategories(),
    ])
    const { articles, unavailable } = articleResult
    const activeCategory = categories.find((category) => category.slug === categorySlug)

    return (
        <div className="c-app py-12 sm:py-16 md:py-20">
            <header className="mb-8 max-w-2xl md:mb-10">
                <div className="section-eyebrow mb-3">Blog &amp; Artikel</div>
                <h1 className="section-title break-words [overflow-wrap:anywhere]">
                    {categorySlug && !activeCategory ? 'Kategori tidak ditemukan' : activeCategory?.name ?? 'Cerita Palembang'}
                </h1>
                <p className="section-copy mt-4">
                    {categorySlug && !activeCategory
                        ? 'Kategori yang Anda pilih tidak tersedia. Jelajahi seluruh cerita Seraso melalui kategori lainnya.'
                        : activeCategory
                        ? `Artikel pilihan dalam kategori ${activeCategory.name}.`
                        : 'Cerita kuliner, resep, dan budaya yang membuat Palembang selalu istimewa.'}
                </p>
            </header>

            {categories.length > 0 && (
                <div className="-mx-4 mb-8 overflow-x-auto px-4 pb-2 sm:mb-10 md:mx-0 md:px-0">
                    <nav aria-label="Kategori artikel" className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
                        <Link
                            href="/artikel"
                            aria-current={!categorySlug ? 'page' : undefined}
                            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
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
                                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                                    category.slug === categorySlug
                                        ? 'border-sr-navy bg-sr-navy text-white'
                                        : 'border-sr-navy/10 bg-white text-sr-navy hover:border-sr-red hover:text-sr-red'
                                }`}
                            >
                                {category.name}
                                {typeof category.articles_count === 'number' && (
                                    <span className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] ${
                                        category.slug === categorySlug ? 'bg-white/15' : 'bg-sr-navy/5 text-sr-gray'
                                    }`}>
                                        {category.articles_count}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
            )}

            {unavailable || articles.length === 0 ? (
                <div className="rounded-3xl border border-sr-navy/10 bg-white px-6 py-14 text-center text-sr-gray shadow-[0_8px_30px_rgba(27,58,107,0.05)] sm:py-16">
                    <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sr-cream-d text-sr-navy" aria-hidden="true">
                        <Newspaper size={26} />
                    </span>
                    <h2 className="text-xl font-bold text-sr-navy">
                        {unavailable
                            ? 'Artikel belum dapat dimuat'
                            : activeCategory
                                ? `Belum ada artikel dalam kategori ${activeCategory.name}`
                                : categorySlug
                                    ? 'Kategori artikel tidak tersedia'
                                    : 'Belum ada artikel tersedia'}
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6">
                        {unavailable
                            ? 'Terjadi kendala saat mengambil artikel. Silakan coba kembali beberapa saat lagi.'
                            : 'Cerita baru sedang kami siapkan. Anda dapat menjelajahi kategori artikel lainnya.'}
                    </p>
                    {(categorySlug || unavailable) && (
                        <Link href="/artikel" className="mt-5 inline-flex min-h-11 items-center gap-2 font-bold text-sr-red hover:text-sr-navy">
                            {unavailable ? 'Coba muat kembali' : 'Lihat semua artikel'} <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                    {articles.map((article, index) => (
                        <Link
                            key={article.id}
                            href={`/artikel/${article.slug}`}
                            className={`c-card group block focus-visible:outline-none ${index === 0 ? 'md:col-span-2' : ''}`}
                        >
                            <div className={`relative overflow-hidden bg-gradient-to-br from-sr-navy to-sr-navy-l ${
                                index === 0 ? 'h-[220px] sm:h-[280px] md:h-[340px]' : 'h-[190px] sm:h-[220px]'
                            }`}>
                                <ArticleMedia
                                    src={article.image ? storageUrl(article.image_url ?? article.image) : undefined}
                                    alt={article.title}
                                    sizes={index === 0
                                        ? '(max-width: 768px) 100vw, 1100px'
                                        : '(max-width: 768px) 100vw, 550px'}
                                    priority={index === 0}
                                />
                                {article.category && (
                                    <div className="absolute left-3.5 top-3.5 z-[2]">
                                        <Tag color="gold">{article.category.name}</Tag>
                                    </div>
                                )}
                                {index === 0 && (
                                    <div className="absolute right-3.5 top-3.5 z-[2]">
                                        <Tag color="navy">Pilihan terbaru</Tag>
                                    </div>
                                )}
                            </div>

                            <div className={index === 0 ? 'p-5 sm:p-6' : 'p-5'}>
                                <time dateTime={article.published_at} className="mb-2 block text-[11px] font-medium text-sr-gray">
                                    {formatDate(article.published_at)}
                                </time>
                                <h2 className={`font-display mb-2 break-words font-bold leading-snug text-sr-navy transition-colors [overflow-wrap:anywhere] group-hover:text-sr-red ${
                                    index === 0 ? 'text-[1.6rem] md:text-[2rem]' : 'text-[1.3rem]'
                                }`}>
                                    {article.title}
                                </h2>
                                {article.meta_description && (
                                    <p className="mb-4 line-clamp-2 break-words text-sm leading-6 text-sr-gray [overflow-wrap:anywhere]">
                                        {article.meta_description}
                                    </p>
                                )}
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sr-red">
                                    Baca selengkapnya <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
