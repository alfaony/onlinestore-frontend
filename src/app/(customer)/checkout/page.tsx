'use client'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'
import { useCartStore } from '@/stores/cart.store'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function CheckoutPage() {
  const router      = useRouter()
  const items       = useCartStore(s => s.items)
  const hasHydrated = useCartStore(s => s.hasHydrated)
  const navigating  = useRef(false) // ← flag, jangan redirect kalau sedang navigasi

  useEffect(() => {
    if (hasHydrated && items.length === 0 && !navigating.current) {
      router.replace('/menu')
    }
  }, [hasHydrated, items, router])

  if (!hasHydrated) {
    return (
      <div className="c-app" style={{ minHeight:'60vh', display:'grid', placeItems:'center' }}>
        <div style={{ textAlign:'center', color:'#6B7280' }}>
          <span className="animate-spin" style={{ display:'inline-block', fontSize:22 }}>⟳</span>
          <p style={{ fontSize:12, marginTop:8 }}>Memuat keranjang…</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  return <CheckoutFlow onPaymentSuccess={() => { navigating.current = true }} />
}
