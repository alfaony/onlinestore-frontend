import Link from 'next/link'
import Image from 'next/image'
import { formatDate, storageUrl } from '@/lib/utils'
import api from '@/lib/api'
import type { Article } from '@/types'

async function getArticles(): Promise<Article[]> {
  try { return (await api.get('/articles?per_page=3')).data.data ?? [] } catch { return [] }
}

export default async function LatestArticles() {
  const articles = await getArticles()

  // Jangan tampilkan konten rekaan saat API kosong/tidak tersedia. Selain
  // menyesatkan pengunjung, slug dummy tidak memiliki halaman detail.
  if (articles.length === 0) return null

  return (
    <section className="section-pad border-t border-sr-navy/10 bg-white/55">
      <div className="c-app">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="section-eyebrow mb-3">Cerita &amp; Inspirasi</p>
            <h2 className="section-title">
              Dari dapur Seraso
            </h2>
            <p className="section-copy mt-3">Kenali cerita, budaya, dan rasa di balik kuliner Palembang.</p>
          </div>
          <Link href="/artikel" className="c-btn c-btn-outline c-btn-sm hidden sm:inline-flex">
            Semua Artikel →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {articles.map(a => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="c-card block">
              <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-sr-navy to-sr-navy-l">
                {a.image
                  ? <Image src={storageUrl(a.image_url ?? a.image)} alt={a.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} unoptimized />
                  : <span className="font-display text-2xl font-bold text-white/55">SERASO</span>
                }
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wider">
                  <span className="text-sr-gray">{formatDate(a.published_at)}</span>
                  {a.category && <span className="text-sr-red">{a.category.name}</span>}
                </div>
                <h3 className="font-display mb-2 line-clamp-2 text-[21px] font-bold leading-snug text-sr-navy">
                  {a.title}
                </h3>
                {a.meta_description && (
                  <p className="mb-4 line-clamp-2 text-xs leading-5 text-sr-gray">
                    {a.meta_description}
                  </p>
                )}
                <span className="text-xs font-bold text-sr-red">Baca selengkapnya →</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link href="/artikel" className="c-btn c-btn-outline c-btn-lg c-btn-full">
            Semua Artikel →
          </Link>
        </div>
      </div>
    </section>
  )
}
