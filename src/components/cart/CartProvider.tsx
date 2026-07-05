'use client'
import dynamic from 'next/dynamic'
import { useCartStore } from '@/stores/cart.store'
import { useEffect } from 'react'

const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false })
const BranchSelectorModal = dynamic(
  () => import('@/components/product/BranchSelectorModal'),
  { ssr: false }
)

export default function CartProvider({ children }: { children: React.ReactNode }) {
  const cartOpen = useCartStore(s => s.cartOpen)
  const setCartOpen = useCartStore(s => s.setCartOpen)
  const pendingProduct = useCartStore(s => s.pendingProduct)
  const setPendingProduct = useCartStore(s => s.setPendingProduct)

  useEffect(() => {
    let active = true

    async function hydrateCart() {
      try {
        await useCartStore.persist.rehydrate()
      } finally {
        if (active) useCartStore.getState().setHasHydrated(true)
      }
    }

    void hydrateCart()
    return () => { active = false }
  }, [])

  return (
    <>
      {children}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {pendingProduct && (
        <BranchSelectorModal
          product={pendingProduct}
          onClose={() => setPendingProduct(null)}
        />
      )}
    </>
  )
}
