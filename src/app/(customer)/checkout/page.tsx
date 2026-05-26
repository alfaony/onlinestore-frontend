// src/app/(customer)/checkout/page.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'
import CheckoutFlow from '@/components/checkout/CheckoutFlow'

export default function CheckoutPage() {
    const router = useRouter()
    const items = useCartStore(s => s.items)

    useEffect(() => {
        if (items.length === 0) router.replace('/menu')
    }, [items, router])

    if (items.length === 0) return null
    return <CheckoutFlow />
}