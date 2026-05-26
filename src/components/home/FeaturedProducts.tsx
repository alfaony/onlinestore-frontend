import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/types'

const DUMMY_PRODUCTS: Product[] = [
  {
    id: 'dummy-1',
    name: 'Pempek Kapal Selam',
    slug: 'pempek-kapal-selam',
    description: 'Pempek berisi telur utuh, digoreng hingga kecokelatan. Disajikan dengan cuko pedas khas Palembang.',
    price: 25000,
    is_active: true,
    popular: true,
    category: { id: 'c1', name: 'Pempek', slug: 'pempek', image: null },
    images: [],
    primary_image: null,
    shipping_discounts: [],
    qty: 0,
    branchId: '',
  },
  {
    id: 'dummy-2',
    name: 'Tekwan Kuah',
    slug: 'tekwan-kuah',
    description: 'Bola-bola ikan segar dalam kuah bening gurih dengan jamur kuping dan bengkuang.',
    price: 22000,
    is_active: true,
    popular: true,
    category: { id: 'c2', name: 'Tekwan', slug: 'tekwan', image: null },
    images: [],
    primary_image: null,
    shipping_discounts: [],
    qty: 0,
    branchId: '',
  },
  {
    id: 'dummy-3',
    name: 'Model Goreng',
    slug: 'model-goreng',
    description: 'Tahu isi adonan ikan yang digoreng krispi. Nikmat dengan sambal cuko asam pedas.',
    price: 20000,
    is_active: true,
    popular: false,
    category: { id: 'c3', name: 'Model', slug: 'model', image: null },
    images: [],
    primary_image: null,
    shipping_discounts: [],
    qty: 0,
    branchId: '',
  },
]

export default function FeaturedProducts({ products }: { products: Product[] }) {
  const displayProducts = products.length > 0
    ? products.filter(p => p.popular).slice(0, 6)
    : DUMMY_PRODUCTS

  return (
    <section className="c-app py-14 md:py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-sr-gold text-[10px] font-bold tracking-[3px] uppercase mb-1.5">
            Pilihan Terbaik
          </p>
          <h2 className="font-display text-[38px] font-bold text-sr-navy">
            Menu Unggulan
          </h2>
        </div>
        <Link href="/menu" className="c-btn c-btn-outline c-btn-sm hidden sm:inline-flex">
          Lihat Semua →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayProducts.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Mobile CTA */}
      <div className="mt-6 sm:hidden">
        <Link href="/menu" className="c-btn c-btn-primary c-btn-lg c-btn-full">
          Lihat Semua Menu →
        </Link>
      </div>
    </section>
  )
}
