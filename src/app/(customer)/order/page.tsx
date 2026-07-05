'use client'
import OTPModal from '@/components/checkout/OTPModal'
import type { TrackingOrder } from '@/components/order/OrderTracking'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import { useMemberStore } from '@/stores/member.store'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

const S = {
  navy: '#1B3A6B', red: '#C41E3A', gray: '#6B7280', grayL: '#F3F0EB',
  creamDp: '#EDD9B8', green: '#10B981', gold: '#E8A020', dark: '#1A1A2E',
}

interface MemberOrderSummary {
  order_number: string
  status: string
  payment_status: string
  branch: string | null
  gross_paid: number
  refund_status: string
  refund_type: 'partial' | 'full' | null
  refund_amount: number
  net_total: number
  shipping_status: string | null
  items_count: number
  created_at: string
}

interface PaginatedOrders {
  data: MemberOrderSummary[]
  current_page: number
  last_page: number
}

function statusBadge(status: string): [string, string] {
  return ({
    pending: ['Menunggu', S.gold],
    confirmed: ['Dikonfirmasi', S.navy],
    processing: ['Diproses', S.navy],
    shipped: ['Dikirim', S.green],
    delivered: ['Selesai', S.green],
    cancelled: ['Dibatalkan', S.red],
  } as Record<string, [string, string]>)[status] ?? [status, S.gray]
}

function paymentBadge(status: string): [string, string] {
  return ({
    paid: ['Lunas', S.green],
    unpaid: ['Belum Bayar', S.gold],
    failed: ['Gagal', S.red],
  } as Record<string, [string, string]>)[status] ?? [status, S.gray]
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
      background: `${color}18`, color,
    }}>
      {label}
    </span>
  )
}

function OrderCard({
  orderNumber, branch, createdAt, status, paymentStatus, total, itemsCount,
  refundStatus, refundType, refundAmount,
}: {
  orderNumber: string
  branch: string | null | undefined
  createdAt: string
  status: string
  paymentStatus: string
  total: number
  itemsCount?: number
  refundStatus?: string | null
  refundType?: 'partial' | 'full' | null
  refundAmount?: number
}) {
  const [statusLabel, statusColor] = statusBadge(status)
  const [payLabel, payColor] = paymentBadge(paymentStatus)

  return (
    <Link href={`/order/${orderNumber}`} style={{
      display: 'block', background: '#fff', borderRadius: 14, padding: 18,
      border: `1px solid ${S.creamDp}`, marginBottom: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 10 }}>
        <div>
          <p style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: S.navy }}>{orderNumber}</p>
          <p style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>{branch ?? '—'} · {createdAt}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Badge label={statusLabel} color={statusColor} />
          <Badge label={payLabel} color={payColor} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 12, color: S.gray }}>{itemsCount !== undefined ? `${itemsCount} item` : 'Lihat detail →'}</p>
        <p style={{ fontSize: 15, fontWeight: 700, color: S.dark }}>{formatRupiah(total)}</p>
      </div>
      {refundStatus && refundStatus !== 'none' && (
        <p style={{ fontSize: 11, color: S.gold, marginTop: 6 }}>
          ↩ Refund {refundType === 'full' ? 'penuh' : 'sebagian'}: {formatRupiah(refundAmount ?? 0)}
        </p>
      )}
    </Link>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ color: S.gold, fontSize: 11, fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>PESANAN SAYA</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,38px)', fontWeight: 700, color: S.navy, marginBottom: 4 }}>
        {title}
      </h1>
      <p style={{ fontSize: 13, color: S.gray }}>{subtitle}</p>
    </div>
  )
}

function LoadingCard() {
  return (
    <div style={{ textAlign: 'center', padding: 48 }}>
      <span className="animate-spin" style={{ display: 'inline-block', fontSize: 24 }}>⟳</span>
    </div>
  )
}

function MultiOrderTracking({ orderNumbers }: { orderNumbers: string[] }) {
  const [orders, setOrders] = useState<TrackingOrder[] | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all(orderNumbers.map(async (num) => {
      try {
        return (await api.get<TrackingOrder>(`/orders/${num}/track`)).data
      } catch {
        return null
      }
    })).then(results => {
      if (!cancelled) setOrders(results.filter((order): order is TrackingOrder => order !== null))
    })
    return () => { cancelled = true }
  }, [orderNumbers])

  if (orders === null) return <LoadingCard />

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60, maxWidth: 560, margin: '0 auto' }}>
      <Header
        title="Pesanan Berhasil Dibuat"
        subtitle={`${orders.length} pesanan dari transaksi terakhirmu`}
      />
      {orders.map(order => (
        <OrderCard
          key={order.order_number}
          orderNumber={order.order_number}
          branch={order.branch?.name}
          createdAt={order.created_at}
          status={order.status}
          paymentStatus={order.payment_status}
          total={order.net_total}
          refundStatus={order.refund_status}
          refundType={order.refund_type}
          refundAmount={order.refund_amount}
        />
      ))}
    </div>
  )
}

function MemberOrderHistory() {
  const token = useMemberStore(s => s.token)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [pages, setPages] = useState<MemberOrderSummary[][]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    api.get<PaginatedOrders>('/member/orders', {
      params: { page },
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      if (cancelled) return
      setPages(prev => page === 1 ? [data.data] : [...prev, data.data])
      setLastPage(data.last_page)
      setState('ready')
    }).catch(() => {
      if (!cancelled) setState('error')
    })

    return () => { cancelled = true }
  }, [token, page])

  const orders = pages.flat()

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60, maxWidth: 560, margin: '0 auto' }}>
      <Header title="Riwayat Pesanan" subtitle="Semua pesanan yang pernah kamu buat" />

      {state === 'loading' && orders.length === 0 && <LoadingCard />}

      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: 32, color: S.gray, fontSize: 13 }}>
          Gagal memuat riwayat pesanan. Coba muat ulang halaman.
        </div>
      )}

      {state !== 'error' && orders.length === 0 && state === 'ready' && (
        <div style={{ textAlign: 'center', padding: '48px 16px', background: '#fff', borderRadius: 16, border: `1px solid ${S.creamDp}` }}>
          <p style={{ fontSize: 32, marginBottom: 10 }}>🛍️</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: S.dark, marginBottom: 4 }}>Belum ada pesanan</p>
          <p style={{ fontSize: 12, color: S.gray, marginBottom: 16 }}>Yuk mulai belanja produk favoritmu.</p>
          <Link href="/menu" className="c-btn c-btn-primary c-btn-md">Lihat Menu</Link>
        </div>
      )}

      {orders.map(order => (
        <OrderCard
          key={order.order_number}
          orderNumber={order.order_number}
          branch={order.branch}
          createdAt={order.created_at}
          status={order.status}
          paymentStatus={order.payment_status}
          total={order.net_total}
          itemsCount={order.items_count}
          refundStatus={order.refund_status}
          refundType={order.refund_type}
          refundAmount={order.refund_amount}
        />
      ))}

      {state === 'ready' && page < lastPage && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="c-btn c-btn-outline c-btn-md c-btn-full"
          style={{ marginTop: 8 }}>
          Muat Lebih Banyak
        </button>
      )}
    </div>
  )
}

function LoginPrompt() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [showOTP, setShowOTP] = useState(false)

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60, maxWidth: 440, margin: '0 auto' }}>
      <Header title="Pesanan Saya" subtitle="Masuk dengan nomor WhatsApp untuk melihat riwayat pesananmu" />

      <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: `1px solid ${S.creamDp}` }}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Nama</label>
          <input className="c-input" placeholder="Nama lengkap" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Nomor WhatsApp</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: S.gray }}>+62</span>
            <input className="c-input" style={{ paddingLeft: 44 }} placeholder="8xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/^0/, ''))} />
          </div>
        </div>
        <button
          onClick={() => setShowOTP(true)}
          disabled={!name.trim() || !phone.trim()}
          className="c-btn c-btn-primary c-btn-lg c-btn-full">
          Kirim Kode OTP
        </button>
      </div>

      <OTPModal
        open={showOTP}
        phone={phone}
        name={name}
        onClose={() => setShowOTP(false)}
        onVerified={() => setShowOTP(false)}
      />
    </div>
  )
}

function OrderPageContent() {
  const params = useSearchParams()
  const ordersParam = params.get('orders') ?? ''
  const orderNumbers = ordersParam.split(',').filter(Boolean)
  const isLoggedIn = useMemberStore(s => s.isLoggedIn())

  if (orderNumbers.length > 0) return <MultiOrderTracking orderNumbers={orderNumbers} />
  if (isLoggedIn) return <MemberOrderHistory />
  return <LoginPrompt />
}

export default function OrderPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <OrderPageContent />
    </Suspense>
  )
}
