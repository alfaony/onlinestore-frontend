// src/stores/cart.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { toast } from 'sonner'
import type { Product, Branch } from '@/types'

export interface CartItem {
  id: string
  name: string
  slug: string
  price: number
  primary_image?: any
  qty: number
  branchId: string
  branchName: string
}

export interface BranchGroup {
  branchId: string
  branchName: string
  items: CartItem[]
  subtotal: number
}

interface CartStore {
  items: CartItem[]
  cartOpen: boolean
  pendingProduct: Product | null

  setCartOpen: (open: boolean) => void
  setPendingProduct: (p: Product | null) => void
  addItem: (product: Product, qty: number, branch: Branch) => void
  removeItem: (productId: string, branchId: string) => void
  updateQty: (productId: string, branchId: string, qty: number) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartOpen: false,
      pendingProduct: null,

      setCartOpen: (open) => set({ cartOpen: open }),
      setPendingProduct: (p) => set({ pendingProduct: p }),

      addItem: (product, qty, branch) => {
        const existing = get().items.find(
          i => i.id === String(product.id) && i.branchId === branch.id
        )
        if (existing) {
          set({
            items: get().items.map(i =>
              i.id === String(product.id) && i.branchId === branch.id
                ? { ...i, qty: i.qty + qty }
                : i
            ),
          })
        } else {
          set({
            items: [...get().items, {
              id: String(product.id),
              name: product.name,
              slug: product.slug ?? '',
              price: Number(product.price),
              primary_image: product.primary_image,
              qty,
              branchId: branch.id,
              branchName: branch.name,
            }],
          })
        }
        toast.success(`${product.name} ditambahkan 🛍️`)
        set({ cartOpen: true, pendingProduct: null })
      },

      removeItem: (productId, branchId) => {
        const item = get().items.find(
          i => i.id === productId && i.branchId === branchId
        )
        set({ items: get().items.filter(i => !(i.id === productId && i.branchId === branchId)) })
        if (item) toast.info(`${item.name} dihapus`)
      },

      updateQty: (productId, branchId, qty) => {
        if (qty <= 0) { get().removeItem(productId, branchId); return }
        set({
          items: get().items.map(i =>
            i.id === productId && i.branchId === branchId ? { ...i, qty } : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),
    }),
    { name: 'seraso-cart-v2' }
  )
)

// ─── Selector Hooks (stable, no infinite loop) ─────────────
export const useCartItems = () => useCartStore(useShallow(s => s.items))
export const useCartTotal = () => useCartStore(s => s.items.reduce((sum, i) => sum + i.price * i.qty, 0))
export const useCartCount = () => useCartStore(s => s.items.reduce((sum, i) => sum + i.qty, 0))
export const useCartBranchCount = () => useCartStore(s => new Set(s.items.map(i => i.branchId)).size)

// ─── Pure function (pakai dengan useMemo) ──────────────────
export function groupCartByBranch(items: CartItem[]): BranchGroup[] {
  const map: Record<string, BranchGroup> = {}
  for (const item of items) {
    if (!map[item.branchId]) {
      map[item.branchId] = { branchId: item.branchId, branchName: item.branchName, items: [], subtotal: 0 }
    }
    map[item.branchId].items.push(item)
    map[item.branchId].subtotal += item.price * item.qty
  }
  return Object.values(map)
}