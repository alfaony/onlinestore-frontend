'use client'

import { useCartStore } from '@/stores/cart.store'
import type { Branch } from '@/types'
import { useEffect } from 'react'

export default function ActiveBranchSync({ branch }: { branch: Branch | null }) {
  const setActiveBranch = useCartStore(state => state.setActiveBranch)
  const setSwitchingBranch = useCartStore(state => state.setSwitchingBranch)

  useEffect(() => {
    setActiveBranch(branch ? { id: branch.id, name: branch.name } : null)
    setSwitchingBranch(false)
  }, [branch, setActiveBranch, setSwitchingBranch])

  return null
}
