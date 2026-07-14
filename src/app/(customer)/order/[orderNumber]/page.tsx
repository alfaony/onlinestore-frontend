'use client'

import OrderTracking, { type TrackingOrder } from '@/components/order/OrderTracking'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const token = useMemberStore(state => state.token)
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    let cancelled = false
    api.get<TrackingOrder>(`/orders/${orderNumber}/track`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      if (!cancelled) setOrder(data)
    }).catch(() => {
      if (!cancelled) setError('Pesanan tidak ditemukan atau bukan milik akun ini.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [orderNumber, token])

  if (token && loading) return <div className="c-app" style={{ padding:'80px 16px', textAlign:'center' }}>Memuat status pesanan…</div>
  if (!order) {
    return (
      <div className="c-app" style={{ maxWidth:520, padding:'80px 16px', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
        <h1 style={{ color:'#1B3A6B', fontSize:24, marginBottom:8 }}>Pesanan dilindungi</h1>
        <p style={{ color:'#6B7280', fontSize:13, lineHeight:1.6, marginBottom:20 }}>
          {error || 'Verifikasi WhatsApp diperlukan untuk melihat pesanan ini.'}
        </p>
        <Link href="/checkout" className="c-btn c-btn-primary c-btn-md">Verifikasi WhatsApp</Link>
      </div>
    )
  }

  return <OrderTracking order={order} />
}
