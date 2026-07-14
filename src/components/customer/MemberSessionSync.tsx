'use client'

import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import type { Member } from '@/types'
import axios from 'axios'
import { useEffect } from 'react'

/**
 * Sinkronkan session tersimpan dengan backend sekali setiap token berubah.
 * Token yang tidak valid dibuang; gangguan jaringan tidak otomatis me-logout user.
 */
export default function MemberSessionSync() {
  const token = useMemberStore(state => state.token)

  useEffect(() => {
    if (!token) return

    let cancelled = false

    api.get<Partial<Member>>('/member/profile', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15_000,
    })
      .then(({ data }) => {
        if (cancelled) return

        const current = useMemberStore.getState().member
        useMemberStore.getState().setMember({
          ...current,
          ...data,
          addresses: data.addresses ?? current?.addresses ?? [],
        } as Member, token)
      })
      .catch(error => {
        if (cancelled || !axios.isAxiosError(error)) return
        if ([401, 403].includes(error.response?.status ?? 0)) {
          useMemberStore.getState().clearMember()
        }
      })

    return () => { cancelled = true }
  }, [token])

  return null
}
