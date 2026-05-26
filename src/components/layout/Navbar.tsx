'use client'
import {
  useCartStore,
  useCartTotal,
  useCartCount,
} from '@/stores/cart.store'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { formatRupiah } from '@/lib/utils'

const LINKS = [['/', 'Beranda'], ['/menu', 'Menu'], ['/artikel', 'Artikel']] as const

export default function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobile] = useState(false)
  const cartCount = useCartCount()
  const cartTotal = useCartTotal()
  const setCartOpen = useCartStore(s => s.setCartOpen)
  useEffect(() => setMounted(true), [])

  const hasCart = mounted && cartCount > 0

  return (
    <nav className='sticky top-0 z-50 bg-sr-cream/95 backdrop-blur-md border-b border-sr-cream-dp'>
      <div className="c-app h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/"><Logo size={26} /></Link>

        {/* Desktop pill tabs */}
        <div className="hidden md:flex items-center gap-1 bg-sr-gray-l rounded-xl p-1">
          {LINKS.map(([href, label]) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? '#C41E3A' : '#6B7280',
                padding: '7px 16px',
                borderRadius: 7,
                background: active ? '#fff' : 'transparent',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Cart — desktop */}
          <button
            onClick={() => setCartOpen(true)}
            className={`hidden md:flex ${hasCart ? 'animate-cart-pulse' : ''}`}
            style={{
              background: hasCart ? '#C41E3A' : '#1B3A6B',
              border: 'none', borderRadius: 10,
              padding: '10px 18px', color: '#fff',
              fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative', transition: 'background 0.3s',
              cursor: 'pointer',
            }}>
            🛍️
            <span>{hasCart ? formatRupiah(cartTotal) : 'Keranjang'}</span>
            {hasCart && (
              <span style={{
                position: 'absolute', top: -7, right: -7,
                background: '#E8A020', color: '#fff',
                fontSize: 10, fontWeight: 700,
                minWidth: 19, height: 19, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>{cartCount}</span>
            )}
          </button>

          {/* Cart icon — mobile */}
          <button onClick={() => setCartOpen(true)}
            className="flex md:hidden"
            style={{ background: 'none', border: 'none', padding: 8, position: 'relative', cursor: 'pointer' }}>
            🛍️
            {hasCart && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                background: '#C41E3A', color: '#fff',
                fontSize: 9, fontWeight: 700, width: 16, height: 16,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </button>

          {/* Burger */}
          <button onClick={() => setMobile(v => !v)}
            className="flex md:hidden"
            style={{ background: 'none', border: 'none', padding: 8, fontSize: 20, cursor: 'pointer', color: '#1B3A6B' }}>
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="animate-fade-up" style={{
          borderTop: '1px solid #EDD9B8',
          background: '#FDF8F2',
          padding: '12px 1rem',
        }}>
          {LINKS.map(([href, label]) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setMobile(false)} style={{
                display: 'block', padding: '10px 12px',
                fontSize: 14, fontWeight: 500,
                color: active ? '#C41E3A' : '#6B7280',
                borderRadius: 8,
                background: active ? 'rgba(196,30,58,0.06)' : 'transparent',
                marginBottom: 2,
              }}>
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}