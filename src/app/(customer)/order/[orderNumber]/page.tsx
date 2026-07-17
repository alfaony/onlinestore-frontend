'use client'

import OTPModal from '@/components/checkout/OTPModal'
import OrderTracking, { type TrackingOrder } from '@/components/order/OrderTracking'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TrackingPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const token = useMemberStore(state => state.token)
  const member = useMemberStore(state => state.member)
  const clearMember = useMemberStore(state => state.clearMember)
  const [order, setOrder] = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState(member?.name ?? '')
  const [phone, setPhone] = useState(member?.phone?.replace(/^(62|0)/, '') ?? '')
  const [showOTP, setShowOTP] = useState(false)

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
    const canRequestOtp = name.trim().length > 0 && phone.length >= 9

    return (
      <div className="c-app" style={{ maxWidth:520, padding:'64px 16px' }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔐</div>
          <h1 style={{ color:'#1B3A6B', fontSize:28, marginBottom:8 }}>Pesanan dilindungi</h1>
          <p style={{ color:'#6B7280', fontSize:13, lineHeight:1.6 }}>
            {error || 'Verifikasi nomor WhatsApp yang digunakan saat memesan untuk membuka status pesanan.'}
          </p>
        </div>

        {token && error ? (
          <button
            type="button"
            onClick={() => { clearMember(); setOrder(null); setError(''); setLoading(false) }}
            className="c-btn c-btn-primary c-btn-lg c-btn-full"
          >
            Verifikasi nomor lain
          </button>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #EDD9B8', borderRadius:16, padding:20 }}>
            <div style={{ marginBottom:14 }}>
              <label htmlFor="tracking-name" style={{ display:'block', color:'#6B7280', fontSize:12, fontWeight:600, marginBottom:6 }}>Nama penerima</label>
              <input id="tracking-name" className="c-input" value={name} onChange={event => setName(event.target.value)} placeholder="Nama yang digunakan saat memesan" />
            </div>
            <div style={{ marginBottom:18 }}>
              <label htmlFor="tracking-phone" style={{ display:'block', color:'#6B7280', fontSize:12, fontWeight:600, marginBottom:6 }}>Nomor WhatsApp</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#6B7280', fontSize:13 }}>+62</span>
                <input
                  id="tracking-phone"
                  className="c-input"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value.replace(/\D/g, '').replace(/^0/, ''))}
                  placeholder="8xxxxxxxxxx"
                  style={{ paddingLeft:44 }}
                />
              </div>
            </div>
            <button type="button" onClick={() => setShowOTP(true)} disabled={!canRequestOtp} className="c-btn c-btn-primary c-btn-lg c-btn-full">
              Verifikasi WhatsApp
            </button>
          </div>
        )}

        <OTPModal
          open={showOTP}
          phone={`0${phone}`}
          name={name}
          onClose={() => setShowOTP(false)}
          onVerified={() => { setShowOTP(false); setLoading(true); setError('') }}
        />
      </div>
    )
  }

  return <OrderTracking order={order} />
}
