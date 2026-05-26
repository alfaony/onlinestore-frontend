// src/stores/member.store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Member } from '@/types'

interface MemberStore {
    member: Member | null
    token: string | null
    setMember: (member: Member, token: string) => void
    clearMember: () => void
    isLoggedIn: () => boolean
}

export const useMemberStore = create<MemberStore>()(
    persist(
        (set, get) => ({
            member: null,
            token: null,
            setMember: (member, token) => set({ member, token }),
            clearMember: () => set({ member: null, token: null }),
            isLoggedIn: () => !!get().token,
        }),
        { name: 'seraso-member' }
    )
)