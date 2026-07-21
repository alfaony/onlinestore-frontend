import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatDate, storageUrl } from '@/lib/utils'
import api from '@/lib/api'
import ArticleMedia from '@/components/article/ArticleMedia'
import Tag from '@/components/ui/Tag'
import type { Article } from '@/types'

async function getArticles(): Promise<Article[]> {
  try { return (await api.get('/articles?per_page=3')).data.data ?? [] } catch { return [] }
}

export default async function LatestArticles() {
  const articles = await getArticles()

  // Jangan tampilkan konten rekaan saat API kosong/tidak tersedia. Selain
  // menyesatkan pengunjung, slug dummy tidak memiliki halaman detail.
  if (articles.length === 0) return null

  const desktopGrid = articles.length === 1
    ? 'lg:grid-cols-1 lg:max-w-2xl'
    : articles.length === 2
      ? 'lg:grid-cols-2'
      : 'lg:grid-cols-3'

  return (
    <section className="section-pad border-t border-sr-navy/10 bg-white/55" aria-labelledby="latest-articles-heading">
      <div className="c-app">
        <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
          <div className="min-w-0">
            <p className="section-eyebrow mb-3">Cerita &amp; Inspirasi</p>
            <h2 id="latest-articles-heading" className="section-title">
              Dari dapur Seraso
            </h2>
            <p className="section-copy mt-3">Kenali cerita, budaya, dan rasa di balik kuliner Palembang.</p>
          </div>
          <Link href="/artikel" className="c-btn c-btn-outline c-btn-sm hidden shrink-0 sm:inline-flex">
            Semua Artikel <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 ${desktopGrid}`}>
          {articles.map(a => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="c-card group flex min-h-full flex-col focus-visible:outline-none">
              <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-sr-navy to-sr-navy-l">
                <ArticleMedia
                  src={a.image ? storageUrl(a.image_url ?? a.image) : undefined}
                  alt={a.title}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {a.category && (
                  <div className="absolute left-3.5 top-3.5 z-[2]">
                    <Tag color="gold">{a.category.name}</Tag>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <time dateTime={a.published_at} className="mb-2 text-[11px] font-medium text-sr-gray">
                  {formatDate(a.published_at)}
                </time>
                <h3 className="font-display mb-2 line-clamp-2 break-words text-[1.35rem] font-bold leading-snug text-sr-navy transition-colors [overflow-wrap:anywhere] group-hover:text-sr-red">
                  {a.title}
                </h3>
                {a.meta_description && (
                  <p className="mb-4 line-clamp-2 break-words text-sm leading-6 text-sr-gray [overflow-wrap:anywhere]">
                    {a.meta_description}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-sr-red">
                  Baca selengkapnya <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link href="/artikel" className="c-btn c-btn-outline c-btn-lg c-btn-full">
            Semua Artikel <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
