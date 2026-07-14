'use client'
import Logo from '@/components/ui/Logo'
import { formatRupiah } from '@/lib/utils'
import { useCartCount, useCartStore, useCartTotal } from '@/stores/cart.store'
import { useMemberStore } from '@/stores/member.store'
import { Menu, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const LINKS = [['/', 'Beranda'], ['/menu', 'Menu'], ['/artikel', 'Artikel']] as const

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobile] = useState(false)

  const cartCount   = useCartCount()
  const cartTotal   = useCartTotal()
  const setCartOpen = useCartStore(s => s.setCartOpen)
  const hasHydrated = useCartStore(s => s.hasHydrated)
  const member = useMemberStore(s => s.member)
  const token = useMemberStore(s => s.token)
  const [mounted, setMounted] = useState(false)
  // Client-only persisted member state must wait until hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), [])

  const hasCart = hasHydrated && cartCount > 0

  return (
    <nav aria-label="Navigasi utama" className="sticky top-0 z-50 border-b border-sr-navy/10 bg-sr-cream/95 shadow-[0_4px_20px_rgba(27,58,107,0.04)] backdrop-blur-xl">
      <div className="c-app flex h-16 items-center justify-between gap-3 md:h-[72px]">

        {/* Logo */}
        <Link href="/" aria-label="Seraso Palembang - Beranda"><Logo height={52} variant="header" /></Link>

        {/* Desktop pill tabs */}
        <div className="hidden items-center gap-1 rounded-xl bg-sr-navy/[0.06] p-1 md:flex">
          {LINKS.map(([href, label]) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link key={href} href={href} aria-current={active ? 'page' : undefined} style={{
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? '#C41E3A' : '#6B7280',
                padding: '8px 17px',
                borderRadius: 9,
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
        <div className="flex shrink-0 items-center gap-2">
          {mounted && (
            member && token ? (
              <Link href="/account/profile" style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 12px', background:'rgba(27,58,107,0.06)',
                borderRadius:8, fontSize:12, color:'#1B3A6B',
                fontWeight:500, textDecoration:'none',
              }}>
                <span>👤</span>
                <span className="hidden md:inline">{member.name ?? 'Akun'}</span>
              </Link>
            ) : (
              <Link href="/account/login" style={{
                fontSize:12, color:'#1B3A6B', fontWeight:600,
                padding:'6px 12px', background:'rgba(27,58,107,0.06)',
                borderRadius:8, textDecoration:'none',
              }}>
                Masuk
              </Link>
            )
          )}
          {/* Cart — desktop */}
          <button
            onClick={() => setCartOpen(true)}
            aria-label={hasCart ? `Buka keranjang, ${cartCount} item` : 'Buka keranjang'}
            className={`relative hidden min-h-11 items-center gap-2 rounded-xl border-0 px-4 text-[13px] font-semibold text-white transition-colors md:flex ${hasCart ? 'animate-cart-pulse bg-sr-red' : 'bg-sr-navy hover:bg-sr-navy-l'}`}>
            <ShoppingBag size={17} aria-hidden="true" />
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
          <button onClick={() => setCartOpen(true)} aria-label={hasCart ? `Buka keranjang, ${cartCount} item` : 'Buka keranjang'}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border-0 bg-sr-navy/[0.06] text-sr-navy md:hidden">
            <ShoppingBag size={19} aria-hidden="true" />
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
          <button onClick={() => setMobile(v => !v)} aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation"
            className="flex h-10 w-10 items-center justify-center rounded-xl border-0 bg-sr-navy/[0.06] text-sr-navy md:hidden">
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div id="mobile-navigation" className="animate-fade-up" style={{
          borderTop: '1px solid #EDD9B8',
          background: '#FDF8F2',
          padding: '10px 1.25rem 16px',
        }}>
          {LINKS.map(([href, label]) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={() => setMobile(false)} style={{
                display: 'block', padding: '12px 14px',
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
