import Link from 'next/link'
import Image from 'next/image'
import { formatDate, storageUrl } from '@/lib/utils'
import api from '@/lib/api'
import type { Article } from '@/types'

const DUMMY_ARTICLES: Article[] = [
  {
    id: 'dummy-a1',
    title: 'Sejarah Pempek: Makanan Khas Palembang yang Mendunia',
    slug: 'sejarah-pempek',
    image: null,
    meta_description: 'Pempek telah menjadi ikon kuliner Palembang selama ratusan tahun. Simak perjalanan sejarahnya.',
    published_at: new Date().toISOString(),
    category: { id: 'cat1', name: 'Kuliner', slug: 'kuliner', image: null },
  },
  {
    id: 'dummy-a2',
    title: 'Tips Memilih Pempek Berkualitas: Panduan Lengkap',
    slug: 'tips-memilih-pempek',
    image: null,
    meta_description: 'Bagaimana cara membedakan pempek asli dan berkualitas? Simak tips lengkap dari ahlinya.',
    published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: { id: 'cat1', name: 'Tips', slug: 'tips', image: null },
  },
  {
    id: 'dummy-a3',
    title: 'Resep Cuko Pempek Asli Palembang yang Autentik',
    slug: 'resep-cuko-pempek',
    image: null,
    meta_description: 'Cuko adalah jiwa dari pempek. Pelajari cara membuat cuko pempek asli Palembang di rumah.',
    published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    category: { id: 'cat2', name: 'Resep', slug: 'resep', image: null },
  },
]

async function getArticles(): Promise<Article[]> {
  try { return (await api.get('/articles?per_page=3')).data.data ?? [] } catch { return [] }
}

export default async function LatestArticles() {
  const articles = await getArticles()
  const displayArticles = articles.length > 0 ? articles : DUMMY_ARTICLES

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
          {displayArticles.map(a => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="c-card block">
              <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-sr-navy to-sr-navy-l">
                {a.image
                  ? <Image src={storageUrl(a.image_url ?? a.image)} alt={a.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: 'cover' }} unoptimized />
                  : <span className="font-display text-2xl font-bold text-white/55">SERASO</span>
                }
              </div>
              <div className="p-5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-sr-gray">{formatDate(a.published_at)}</p>
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
