// frontend/src/components/layout/Navbar.tsx
'use client'
import Link from 'next/link'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/stores/cart.store'
import CartDrawer from '@/components/cart/CartDrawer'
import { Button } from '@/components/ui/button'

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const itemCount = useCartStore(s => s.itemCount())

    const links = [
        { href: '/', label: 'Beranda' },
        { href: '/menu', label: 'Menu' },
        { href: '/artikel', label: 'Artikel' },
    ]

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="font-playfair text-2xl font-bold text-[--color-primary]">
                            Seraso
                        </span>
                        <span className="text-xs text-[--color-accent] font-medium tracking-widest uppercase">
                            Palembang
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {links.map(l => (
                            <Link key={l.href} href={l.href}
                                className="text-sm font-medium text-gray-600 hover:text-[--color-primary] transition-colors">
                                {l.label}
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="relative"
                            onClick={() => setCartOpen(true)}>
                            <ShoppingCart className="w-5 h-5" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[--color-primary] text-white
                  text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {itemCount}
                                </span>
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden"
                            onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-amber-50 bg-white px-4 py-3 space-y-2">
                        {links.map(l => (
                            <Link key={l.href} href={l.href}
                                className="block py-2 text-sm font-medium text-gray-600 hover:text-[--color-primary]"
                                onClick={() => setMenuOpen(false)}>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    )
}