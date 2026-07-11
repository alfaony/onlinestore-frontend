// src/stores/affiliate.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AffiliateStore {
    code: string | null
    setCode: (code: string) => void
    clearCode: () => void
}

export const useAffiliateStore = create<AffiliateStore>()(
    persist(
        (set) => ({
            code: null,
            setCode: (code) => set({ code }),
            clearCode: () => set({ code: null }),
        }),
        { name: 'seraso-affiliate' }
    )
)
