// frontend/src/components/home/HeroSection.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function HeroSection() {
    return (
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[--color-cream]">
                <div className="absolute inset-0 opacity-5"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238B1A1A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-12 items-center">
                {/* Text */}
                <div>
                    <span className="inline-block text-[--color-accent] text-sm font-medium tracking-widest uppercase mb-4">
                        Autentik Sejak Dahulu
                    </span>
                    <h1 className="font-playfair text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                        Cita Rasa <br />
                        <span className="text-[--color-primary]">Palembang</span> <br />
                        di Rumahmu
                    </h1>
                    <p className="text-[--color-warm-gray] text-lg mb-8 leading-relaxed">
                        Pempek, Tekwan, Model, dan berbagai hidangan khas Palembang
                        dibuat dengan resep autentik dan bahan pilihan terbaik.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/menu">
                            <Button className="bg-[--color-primary] hover:bg-[--color-primary-dark]
                text-white rounded-xl px-8 h-12 text-base font-medium">
                                Pesan Sekarang <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                        <Link href="/artikel">
                            <Button variant="outline"
                                className="border-[--color-primary] text-[--color-primary]
                  hover:bg-red-50 rounded-xl px-8 h-12 text-base">
                                Tentang Kami
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Visual */}
                <div className="hidden md:flex justify-center">
                    <div className="relative w-96 h-96">
                        <div className="absolute inset-0 bg-[--color-primary] opacity-10 rounded-full" />
                        <div className="absolute inset-8 bg-[--color-accent] opacity-10 rounded-full" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-9xl">🍜</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}