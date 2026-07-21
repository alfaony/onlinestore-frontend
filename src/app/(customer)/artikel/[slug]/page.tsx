import type { Metadata } from 'next'
import { cache } from 'react'
import { isAxiosError } from 'axios'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, ChevronRight, Clock3, User, UserRound } from 'lucide-react'
import api from '@/lib/api'
import { formatDate, storageUrl, stripHtml } from '@/lib/utils'
import ArticleMedia from '@/components/article/ArticleMedia'
import ArticleReadingProgress from '@/components/article/ArticleReadingProgress'
import ArticleShare from '@/components/article/ArticleShare'
import Tag from '@/components/ui/Tag'
import type { Article, ArticleDetailResponse } from '@/types'

interface Props { params: Promise<{ slug: string }> }

interface ArticleHeading {
    id: string
    level: 2 | 3
    text: string
}

const getData = cache(async (slug: string): Promise<ArticleDetailResponse | null> => {
    try {
        return (await api.get<ArticleDetailResponse>(`/articles/${encodeURIComponent(slug)}`)).data
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null
        throw error
    }
})

async function getLatestArticles(currentArticleId: string): Promise<Article[]> {
    try {
        const response = await api.get('/articles', { params: { per_page: 4 } })
        return ((response.data.data ?? []) as Article[])
            .filter((article) => article.id !== currentArticleId)
            .slice(0, 3)
    } catch {
        return []
    }
}

function decodeArticleText(value: string): string {
    return value
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#(?:0*39|x0*27);/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
        .replace(/\s+/g, ' ')
        .trim()
}

function headingSlug(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'bagian'
}

function prepareArticleContent(content: string): { html: string; headings: ArticleHeading[] } {
    const headings: ArticleHeading[] = []
    const slugCounts = new Map<string, number>()
    const html = content.replace(
        /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
        (match: string, levelValue: string, attributes: string, innerHtml: string) => {
            const text = decodeArticleText(stripHtml(innerHtml))
            if (!text) return match

            const baseSlug = headingSlug(text)
            const count = (slugCounts.get(baseSlug) ?? 0) + 1
            slugCounts.set(baseSlug, count)
            const id = count === 1 ? baseSlug : `${baseSlug}-${count}`
            const level = Number(levelValue) as 2 | 3
            const cleanAttributes = attributes.replace(/\s+id=(['"])[\s\S]*?\1/gi, '')

            headings.push({ id, level, text })
            return `<h${level}${cleanAttributes} id="${id}">${innerHtml}</h${level}>`
        },
    )

    return { html, headings }
}

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
    const recommendations = related.length > 0 ? related : await getLatestArticles(article.id)
    const recommendationsAreRelated = related.length > 0
    const imageUrl = article.image ? storageUrl(article.image_url ?? article.image) : undefined
    const categoryHref = article.category
        ? `/artikel?category=${encodeURIComponent(article.category.slug)}`
        : '/artikel'
    const authorName = article.author?.name ?? 'Tim Seraso'
    const readingTime = Math.max(1, Math.ceil(stripHtml(article.content).split(/\s+/).filter(Boolean).length / 200))
    const preparedContent = prepareArticleContent(article.content)
    const showTableOfContents = preparedContent.headings.length >= 2
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.meta_description,
        image: imageUrl,
        datePublished: article.published_at,
        dateModified: article.updated_at,
        articleSection: article.category?.name,
        timeRequired: `PT${readingTime}M`,
        author: { '@type': 'Person', name: authorName },
        publisher: { '@type': 'Organization', name: 'Seraso Palembang' },
    }

    const tableOfContents = (
        <ol className="mt-3 space-y-2.5">
            {preparedContent.headings.map((heading) => (
                <li key={heading.id} className={heading.level === 3 ? 'pl-4' : ''}>
                    <a href={`#${heading.id}`} className="text-sm leading-relaxed text-sr-gray transition-colors hover:text-sr-red">
                        {heading.text}
                    </a>
                </li>
            ))}
        </ol>
    )

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            <ArticleReadingProgress targetId="article-reader" />

            <div className="c-app pb-16 pt-7 md:pb-24 md:pt-10">
                <nav aria-label="Breadcrumb" className="mx-auto mb-7 max-w-4xl">
                    <Link href="/artikel" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-sr-navy hover:text-sr-red sm:hidden">
                        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke Artikel
                    </Link>
                    <div className="hidden flex-wrap items-center gap-1.5 text-xs text-sr-gray sm:flex">
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
                    </div>
                </nav>

                <header className="mx-auto max-w-4xl text-center">
                    {article.category && (
                        <Link href={categoryHref} className="mb-4 inline-flex" aria-label={`Lihat artikel kategori ${article.category.name}`}>
                            <Tag color="gold">{article.category.name}</Tag>
                        </Link>
                    )}

                    <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-[-0.02em] text-sr-dark sm:text-[2.6rem] md:text-[3.35rem]">
                        {article.title}
                    </h1>

                    {article.meta_description && (
                        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-7 text-sr-gray sm:text-base md:text-lg">
                            {article.meta_description}
                        </p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-sr-gray sm:gap-x-5 sm:text-[13px]">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <User size={15} aria-hidden="true" /> {authorName}
                        </span>
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar size={15} aria-hidden="true" /> {formatDate(article.published_at)}
                        </span>
                        <span className="flex basis-full items-center justify-center gap-1.5 whitespace-nowrap sm:basis-auto">
                            <Clock3 size={15} aria-hidden="true" /> {readingTime} menit membaca
                        </span>
                    </div>
                </header>

                <div className="relative mx-auto mt-8 aspect-[4/3] max-w-5xl overflow-hidden rounded-2xl bg-gradient-to-br from-sr-navy to-sr-navy-l shadow-[0_20px_60px_rgba(27,58,107,0.13)] sm:aspect-[16/10] md:mt-10 md:aspect-[16/8] md:rounded-[28px]">
                    <ArticleMedia
                        src={imageUrl}
                        alt={article.title}
                        sizes="(max-width: 768px) 100vw, 980px"
                        variant="hero"
                        priority
                    />
                </div>

                <article id="article-reader" className="mx-auto mt-10 grid w-full min-w-0 max-w-[880px] grid-cols-1 gap-8 md:mt-14 lg:grid-cols-[56px_minmax(0,720px)]">
                    <aside aria-label="Bagikan artikel" className="hidden lg:block">
                        <div className="sticky top-28">
                            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-sr-gray">Bagikan</p>
                            <ArticleShare title={article.title} description={article.meta_description} compact />
                        </div>
                    </aside>

                    <div className="min-w-0">
                        {showTableOfContents && (
                            <>
                                <details className="article-toc mb-8 md:hidden">
                                    <summary>Daftar isi</summary>
                                    {tableOfContents}
                                </details>
                                <aside className="article-toc mb-10 hidden md:block" aria-labelledby="toc-heading">
                                    <p id="toc-heading" className="font-display text-xl font-bold text-sr-navy">Daftar isi</p>
                                    {tableOfContents}
                                </aside>
                            </>
                        )}

                        <div
                            id="article-body"
                            className="article-content"
                            dangerouslySetInnerHTML={{ __html: preparedContent.html }}
                        />

                        {article.category && (
                            <div className="mt-10 border-t border-sr-navy/10 pt-6">
                                <span className="mr-2 text-sm text-sr-gray">Topik artikel:</span>
                                <Link href={categoryHref} className="text-sm font-bold text-sr-red hover:text-sr-navy">
                                    {article.category.name}
                                </Link>
                            </div>
                        )}

                        <section aria-labelledby="mobile-share-heading" className="mt-8 lg:hidden">
                            <h2 id="mobile-share-heading" className="mb-3 text-lg font-bold text-sr-navy">Bagikan artikel ini</h2>
                            <ArticleShare title={article.title} description={article.meta_description} />
                        </section>

                        <section className="mt-10 flex items-start gap-4 rounded-2xl border border-sr-navy/10 bg-white p-5 sm:p-6" aria-label="Tentang penulis">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sr-navy text-white">
                                <UserRound size={22} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-sr-red">Ditulis oleh</p>
                                <h2 className="mt-1 text-xl font-bold text-sr-navy">{authorName}</h2>
                                <p className="mt-1.5 break-words text-sm leading-6 text-sr-gray">
                                    Berbagi cerita, resep, dan budaya kuliner autentik Palembang bersama Seraso.
                                </p>
                            </div>
                        </section>
                    </div>
                </article>

                {recommendations.length > 0 && (
                    <section aria-labelledby="recommendations-heading" className="mx-auto mt-16 max-w-5xl border-t border-sr-navy/10 pt-10 md:mt-20 md:pt-12">
                        <div className="mb-7 flex items-end justify-between gap-5">
                            <div>
                                <p className="section-eyebrow mb-2">Bacaan selanjutnya</p>
                                <h2 id="recommendations-heading" className="font-display text-3xl font-bold text-sr-navy md:text-4xl">
                                    {recommendationsAreRelated && article.category
                                        ? `Artikel ${article.category.name} lainnya`
                                        : 'Artikel terbaru'}
                                </h2>
                            </div>
                            <Link href={recommendationsAreRelated ? categoryHref : '/artikel'} className="hidden text-sm font-bold text-sr-red hover:text-sr-navy sm:inline-flex">
                                Lihat semua →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {recommendations.map((recommendation) => (
                                <Link key={recommendation.id} href={`/artikel/${recommendation.slug}`} className="c-card group grid min-h-[112px] grid-cols-[108px_1fr] sm:block">
                                    <div className="relative min-h-[112px] overflow-hidden bg-sr-cream-d sm:aspect-[16/10] sm:min-h-0">
                                        <ArticleMedia
                                            src={recommendation.image ? storageUrl(recommendation.image_url ?? recommendation.image) : undefined}
                                            alt=""
                                            sizes="(max-width: 640px) 108px, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                    <div className="flex min-w-0 flex-col justify-center p-4 sm:block">
                                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sr-red">
                                            {recommendation.category?.name ?? 'Artikel'}
                                        </p>
                                        <h3 className="line-clamp-2 text-base font-bold leading-snug text-sr-navy group-hover:text-sr-red sm:text-lg">
                                            {recommendation.title}
                                        </h3>
                                        <p className="mt-2 hidden text-xs text-sr-gray sm:block">{formatDate(recommendation.published_at)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <Link href={recommendationsAreRelated ? categoryHref : '/artikel'} className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-sr-red hover:text-sr-navy sm:hidden">
                            Lihat semua artikel →
                        </Link>
                    </section>
                )}
            </div>
        </>
    )
}
