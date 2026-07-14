// src/stores/cart.store.ts
import type { PreparationMethod, Product, ProductImage } from '@/types'
import { toast } from 'sonner'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

export interface CartItem {
  id: string
  name: string
  slug: string
  price: number
  primary_image?: ProductImage | null
  qty: number
  branchId: string
  branchName: string
  preparation_methods?: PreparationMethod[]
}

export const DEFAULT_PREPARATION_METHODS: PreparationMethod[] = ['frozen', 'kukus', 'goreng']

export function getPreparationMethods(item: Pick<CartItem, 'preparation_methods'>): PreparationMethod[] {
  return item.preparation_methods?.length ? item.preparation_methods : DEFAULT_PREPARATION_METHODS
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
  hasHydrated: boolean
  pendingProduct: Product | null
  activeBranch: { id: string; name: string } | null
  switchingBranch: boolean

  setActiveBranch: (b: { id: string; name: string } | null) => void
  setSwitchingBranch: (v: boolean) => void
  setHasHydrated: (v: boolean) => void

  setCartOpen: (open: boolean) => void
  setPendingProduct: (p: Product | null) => void
  addItem: (product: Product, qty: number, branch: { id: string; name: string }) => void
  removeItem: (productId: string, branchId: string) => void
  updateQty: (productId: string, branchId: string, qty: number) => void
  clearCart: () => void
}

let switchingBranchTimeout: ReturnType<typeof setTimeout> | null = null

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartOpen: false,
      pendingProduct: null,

      setCartOpen: (open) => set({ cartOpen: open }),
      setPendingProduct: (p) => set({ pendingProduct: p }),

      activeBranch: null,
      setActiveBranch: (b) => set({ activeBranch: b }),

      switchingBranch: false,
      setSwitchingBranch: (v) => {
        if (switchingBranchTimeout) { clearTimeout(switchingBranchTimeout); switchingBranchTimeout = null }
        if (v) {
          // Jaga-jaga kalau navigasi gagal/dibatalkan — jangan sampai spinner nyangkut selamanya.
          switchingBranchTimeout = setTimeout(() => set({ switchingBranch: false }), 8000)
        }
        set({ switchingBranch: v })
      },

      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),
      addItem: (product, qty, branch) => {
        const availableBranchIds = product.branch_availability ?? []
        if (!availableBranchIds.includes(branch.id)) {
          toast.error(`${product.name} tidak tersedia di ${branch.name}`)
          return
        }

        const branchPrice = product.branch_prices?.[branch.id]
        const resolvedPrice = Number(branchPrice ?? product.price)
        const preparationMethods = product.preparation_methods?.length
          ? product.preparation_methods
          : DEFAULT_PREPARATION_METHODS
        const existing = get().items.find(
          i => i.id === String(product.id) && i.branchId === branch.id
        )
        if (existing) {
          set({
            items: get().items.map(i =>
              i.id === String(product.id) && i.branchId === branch.id
                ? { ...i, qty: i.qty + qty, price: resolvedPrice, preparation_methods: preparationMethods }
                : i
            ),
          })
        } else {
          set({
            items: [...get().items, {
              id: String(product.id),
              name: product.name,
              slug: product.slug ?? '',
              price: resolvedPrice,
              primary_image: product.primary_image,
              qty,
              branchId: branch.id,
              branchName: branch.name,
              preparation_methods: preparationMethods,
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
    {
      name: 'seraso-cart-v2',
      skipHydration: true,
      partialize: state => ({
        items: state.items,
        activeBranch: state.activeBranch,
      }),
    }
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
