// frontend/src/components/layout/Footer.tsx
import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="bg-[--color-primary] text-white mt-20">
            <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
                {/* Brand */}
                <div>
                    <h3 className="font-playfair text-2xl font-bold mb-2">Seraso Palembang</h3>
                    <p className="text-red-200 text-sm leading-relaxed">
                        Makanan khas Palembang autentik yang dibuat dengan cinta dan resep turun-temurun.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h4 className="font-semibold mb-4 text-red-100">Navigasi</h4>
                    <div className="space-y-2">
                        {[
                            { href: '/', label: 'Beranda' },
                            { href: '/menu', label: 'Menu' },
                            { href: '/artikel', label: 'Artikel' },
                        ].map(l => (
                            <Link key={l.href} href={l.href}
                                className="block text-sm text-red-200 hover:text-white transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div>
                    <h4 className="font-semibold mb-4 text-red-100">Hubungi Kami</h4>
                    <div className="space-y-3 text-sm text-red-200">
                        <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>Jl. Contoh No. 1, Palembang, Sumatera Selatan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>0711-000-001</span>
                        </div>

                        {/* <div className="flex items-center gap-2">
                            <Instagram className="w-4 h-4 shrink-0" />
                            <span>@seraso.palembang</span>
                        </div> */}
                    </div>
                </div>
            </div>

            <div className="border-t border-red-800 py-4">
                <p className="text-center text-xs text-red-300">
                    © {new Date().getFullYear()} Seraso Palembang. All rights reserved.
                </p>
            </div>
        </footer>
    )
}