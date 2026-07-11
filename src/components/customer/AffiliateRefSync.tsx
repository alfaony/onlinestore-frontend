'use client'

import { useAffiliateStore } from '@/stores/affiliate.store'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

function AffiliateRefSyncInner() {
  const searchParams = useSearchParams()
  const setCode = useAffiliateStore(state => state.setCode)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setCode(ref.toUpperCase())
  }, [searchParams, setCode])

  return null
}

export default function AffiliateRefSync() {
  return (
    <Suspense fallback={null}>
      <AffiliateRefSyncInner />
    </Suspense>
  )
}
