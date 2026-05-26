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
    <section className="bg-sr-cream-d border-t-4 border-sr-gold py-14 md:py-16">
      <div className="c-app">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sr-gold text-[10px] font-bold tracking-[3px] uppercase mb-1.5">Blog</p>
            <h2 className="font-display text-[38px] font-bold text-sr-navy">
              Artikel Terbaru
            </h2>
          </div>
          <Link href="/artikel" className="c-btn c-btn-outline c-btn-sm hidden sm:inline-flex">
            Semua Artikel →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayArticles.map(a => (
            <Link key={a.id} href={`/artikel/${a.slug}`} className="c-card block">
              <div className="h-44 bg-gradient-to-br from-sr-navy to-sr-navy-l flex items-center justify-center relative overflow-hidden">
                {a.image
                  ? <Image src={storageUrl(a.image)} alt={a.title} fill style={{ objectFit: 'cover' }} unoptimized />
                  : <span className="text-5xl">📰</span>
                }
              </div>
              <div className="p-4">
                <p className="text-[11px] text-sr-gray mb-1.5">📅 {formatDate(a.published_at)}</p>
                <h3 className="font-display text-[18px] font-bold text-sr-navy leading-snug mb-2 line-clamp-2">
                  {a.title}
                </h3>
                {a.meta_description && (
                  <p className="text-[11px] text-sr-gray mb-3 line-clamp-2 leading-relaxed">
                    {a.meta_description}
                  </p>
                )}
                <span className="text-sr-red text-xs font-semibold">Baca Selengkapnya →</span>
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
