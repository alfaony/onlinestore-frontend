'use client'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'
import { useCartStore } from '@/stores/cart.store'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function CheckoutPage() {
  const router      = useRouter()
  const items       = useCartStore(s => s.items)
  const navigating  = useRef(false) // ← flag, jangan redirect kalau sedang navigasi

  useEffect(() => {
    if (items.length === 0 && !navigating.current) {
      router.replace('/menu')
    }
  }, [items, router])

  if (items.length === 0) return null

  return <CheckoutFlow onPaymentSuccess={() => { navigating.current = true }} />
}