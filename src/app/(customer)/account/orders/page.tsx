'use client'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import { useMemberStore } from '@/stores/member.store'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', gold:'#E8A020',
  creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB',
  dark:'#1A1A2E', green:'#10B981',
}

interface Order {
  order_number: string
  status: string
  payment_status: string
  branch: string | null
  net_total: number
  items_count: number
  shipping_status: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label:'Menunggu Bayar', color:'#92600A', bg:'#FEF3C7', icon:'⏳' },
  confirmed:  { label:'Dikonfirmasi',   color:'#1E40AF', bg:'#DBEAFE', icon:'✅' },
  processing: { label:'Diproses',       color:'#1E40AF', bg:'#DBEAFE', icon:'🍳' },
  shipped:    { label:'Dikirim',         color:'#065F46', bg:'#D1FAE5', icon:'🚚' },
  delivered:  { label:'Selesai',         color:'#065F46', bg:'#D1FAE5', icon:'🎉' },
  cancelled:  { label:'Dibatalkan',      color:'#991B1B', bg:'#FEE2E2', icon:'✕' },
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  paid:    { label:'Lunas', color:S.green },
  unpaid:  { label:'Belum Bayar', color:'#92600A' },
  failed:  { label:'Gagal', color:S.red },
}

function OrderCard({ order }: { order: Order }) {
  const status  = STATUS_CONFIG[order.status]  ?? { label:order.status,  color:S.gray, bg:S.grayL, icon:'•' }
  const payment = PAYMENT_CONFIG[order.payment_status] ?? { label:order.payment_status, color:S.gray }

  return (
    <div style={{ background:'#fff', borderRadius:14, border:`1px solid ${S.creamDp}`, overflow:'hidden' }}>

      {/* Header */}
      <div className="account-order-head" style={{ padding:'14px 16px', borderBottom:`1px solid ${S.grayL}` }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
            <span style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:S.navy }}>
              {order.order_number}
            </span>
          </div>
          <p style={{ fontSize:11, color:S.gray }}>
            📍 {order.branch ?? 'Cabang tidak tersedia'} · {order.created_at}
          </p>
        </div>
        <div className="account-order-badges">
          <span style={{ fontSize:11, fontWeight:600, padding:'4px 10px', borderRadius:20, background:status.bg, color:status.color }}>
            {status.icon} {status.label}
          </span>
          <span style={{ fontSize:11, fontWeight:600, color:payment.color }}>
            {payment.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${S.grayL}` }}>
        <p style={{ fontSize:12, color:S.dark }}>
          {order.items_count} item dalam pesanan
        </p>
      </div>

      {/* Shipping */}
      {order.shipping_status && (
        <div style={{ padding:'10px 16px', borderBottom:`1px solid ${S.grayL}`, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:S.gray }}>Status pengiriman:</span>
          <span style={{ fontSize:12, fontWeight:600, color:S.navy }}>
            {order.shipping_status}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="account-order-footer" style={{ padding:'14px 16px' }}>
        <div>
          <p style={{ fontSize:11, color:S.gray, marginBottom:2 }}>Total Bayar</p>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:S.red }}>
            {formatRupiah(order.net_total)}
          </p>
        </div>
        <Link href={`/order/${order.order_number}`}
          style={{ fontSize:12, color:S.navy, fontWeight:600, padding:'8px 16px', border:`1px solid ${S.navy}`, borderRadius:8, textDecoration:'none', transition:'all 0.15s' }}>
          Lacak Pesanan →
        </Link>
      </div>
    </div>
  )
}

const STATUS_TABS = [
  { key:'all',       label:'Semua' },
  { key:'pending',   label:'Menunggu' },
  { key:'processing',label:'Diproses' },
  { key:'shipped',   label:'Dikirim' },
  { key:'delivered', label:'Selesai' },
  { key:'cancelled', label:'Dibatalkan' },
]

export default function OrdersPage() {
  const { token } = useMemberStore()
  const [orders,   setOrders]   = useState<Order[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('all')
  const [page,     setPage]     = useState(1)
  const [lastPage, setLastPage] = useState(1)

  const headers = { Authorization: `Bearer ${token}` }

  async function load(p = 1, status = tab) {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p, per_page: 8 }
      if (status !== 'all') params.status = status
      const { data } = await api.get('/member/orders', { params, headers })
      const list = data.data ?? data ?? []
      setOrders(p === 1 ? list : prev => [...prev, ...list])
      setLastPage(data.last_page ?? 1)
      setPage(p)
    } catch { toast.error('Gagal memuat pesanan') }
    finally { setLoading(false) }
  }

  // `load` owns the request lifecycle and synchronizes the loading state.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(1, tab) }, [tab])

  const filtered = orders // sudah difilter dari API

  return (
    <div>
      <header className="account-page-header">
        <div>
          <h1 className="account-page-title">Pesanan Saya</h1>
          <p className="account-page-subtitle">Pantau status dan riwayat semua pesananmu.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="account-tabs" role="tablist" aria-label="Filter status pesanan">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} role="tab" aria-selected={tab === t.key}
            style={{
              padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer',
              background: tab === t.key ? S.navy : S.grayL,
              color: tab === t.key ? '#fff' : S.gray,
              fontSize:12, fontWeight: tab === t.key ? 600 : 400,
              flexShrink:0, transition:'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading && page === 1 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} className="c-shimmer" style={{ height:180, borderRadius:14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:S.gray }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📦</div>
          <p style={{ fontSize:15, fontWeight:600 }}>Belum ada pesanan</p>
          <p style={{ fontSize:12, marginTop:4 }}>
            {tab === 'all' ? 'Yuk mulai pesan menu favorit kamu!' : `Tidak ada pesanan dengan status ini`}
          </p>
          <Link href="/menu"
            style={{ display:'inline-block', marginTop:16, padding:'10px 24px', background:S.red, color:'#fff', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600 }}>
            Pesan Sekarang
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map(order => <OrderCard key={order.order_number} order={order} />)}
          </div>

          {/* Load more */}
          {page < lastPage && (
            <button
              onClick={() => load(page + 1, tab)}
              disabled={loading}
              className="c-btn c-btn-ghost c-btn-md c-btn-full"
              style={{ marginTop:16 }}>
              {loading ? '⟳ Memuat...' : 'Muat Lebih Banyak'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
