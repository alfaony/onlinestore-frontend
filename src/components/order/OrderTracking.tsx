// src/components/order/OrderTracking.tsx
'use client'
import { formatRupiah } from '@/lib/utils'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', gold:'#E8A020',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E',
  green:'#10B981', creamDp:'#EDD9B8', creamD:'#F5EDD9',
}

interface TrackingItem {
  id: string
  product_name: string
  preparation_method: 'frozen' | 'kukus' | 'goreng' | null
  quantity: number
  unit_price: number
  subtotal: number
  is_removed: boolean
  removed_reason: string | null
}

interface TrackingHistory {
  status: string
  note: string
  created_at: string
}

interface TrackingPromotion {
  id: string
  code: string
  name: string
  scope: 'product' | 'delivery' | 'order'
  discount_amount: number
  is_stackable: boolean
}

export interface TrackingOrder {
  order_number: string
  status: string
  order_status: string
  payment_status: string
  fulfillment_status: string | null
  approval_status: string
  fulfillment_type: 'delivery' | 'pickup'
  branch?: { name: string; address?: string; phone?: string }
  payment_type?: string | null
  status_labels: { payment: string; order: string; fulfillment: string }
  created_at: string
  review_url?: string | null
  subtotal: number
  fulfilled_subtotal: number
  cancelled_subtotal: number
  shipping_cost: number
  shipping_discount: number
  voucher_discount: number
  total: number
  net_total: number
  promotions: TrackingPromotion[]
  items: TrackingItem[]
  status_histories: TrackingHistory[]
  shipping: null | {
    courier: string | null
    service: string | null
    base_cost: number
    insurance_fee: number
    estimated_days: number | null
    tracking_number: string | null
    address: string | null
    status: string
    booking_reference: string | null
    booking_requested_at: string | null
    booking_confirmed_at: string | null
  }
  refund_status: string
  refund_type: 'partial' | 'full' | null
  refund_request_number: string | null
  refund_amount: number
  refund_calculation: null | {
    cancelled_items_gross: number
    allocated_voucher_discount: number
    shipping_refunded: boolean
    shipping_amount: number
    shipping_discount: number
    final_refund: number
  }
  refund_reason: string | null
  refund_bank_name: string | null
  refund_account_number: string | null
  refund_account_name: string | null
  refund_transfer_reference: string | null
  refund_proof_url: string | null
  refund_proof_note: string | null
  refund_requested_at: string | null
  refund_processed_at: string | null
  refund_completed_at: string | null
}

interface ProgressStep {
  key: string
  label: string
  icon: string
}

function shippingProgressLabel(status?: string) {
  return ({
    pending: 'Menunggu konfirmasi toko',
    booking: 'Mengirim permintaan penjemputan',
    booking_failed: 'Penjemputan sedang ditindaklanjuti admin',
    booked: 'Penjemputan terdaftar',
    pickup_requested: 'Kurir sudah diminta menjemput pesanan',
    confirmed: 'Permintaan penjemputan diterima Biteship',
    scheduled: 'Penjemputan sudah dijadwalkan',
    allocated: 'Kurir sudah dialokasikan',
    picking_up: 'Kurir sedang menuju toko',
    picked: 'Paket sudah dijemput kurir',
    in_transit: 'Paket sedang dalam perjalanan',
    dropping_off: 'Kurir menuju alamat penerima',
    ready_for_pickup: 'Pesanan siap diambil di toko',
    delivered: 'Pesanan sudah diterima',
    cancelled: 'Pengiriman dibatalkan',
  } as Record<string, string>)[status ?? ''] ?? 'Pesanan sedang diproses'
}

function orderProgress(order: TrackingOrder) {
  const isPickup = order.fulfillment_type === 'pickup'
  const steps: ProgressStep[] = isPickup ? [
    { key:'payment', label:'Pembayaran', icon:'✓' },
    { key:'store', label:'Konfirmasi toko', icon:'🏪' },
    { key:'preparing', label:'Disiapkan', icon:'🍳' },
    { key:'ready', label:'Siap diambil', icon:'🛍️' },
    { key:'completed', label:'Selesai', icon:'🎉' },
  ] : [
    { key:'payment', label:'Pembayaran', icon:'✓' },
    { key:'store', label:'Konfirmasi toko', icon:'🏪' },
    { key:'pickup', label:'Penjemputan', icon:'📦' },
    { key:'shipping', label:'Dikirim', icon:'🚚' },
    { key:'completed', label:'Selesai', icon:'🎉' },
  ]

  const paymentDone = order.payment_status === 'paid'
  const storeDone = ['confirmed','processing','completed'].includes(order.order_status)
  const delivered = ['delivered','picked_up'].includes(order.fulfillment_status ?? '')
  const packagePicked = order.fulfillment_status === 'shipped'
    || ['picked', 'in_transit', 'dropping_off'].includes(order.shipping?.status ?? '')

  let currentIndex = 0
  if (paymentDone) currentIndex = 1
  if (paymentDone && storeDone) currentIndex = 2

  if (isPickup) {
    if (order.fulfillment_status === 'ready_for_pickup') currentIndex = 3
    if (delivered) currentIndex = 4
  } else {
    if (packagePicked) currentIndex = 3
    if (delivered) currentIndex = 4
  }

  const currentDescription = !paymentDone
    ? 'Selesaikan pembayaran melalui Midtrans untuk melanjutkan pesanan.'
    : !storeDone
      ? 'Pembayaran diterima. Toko sedang mengecek ketersediaan semua item.'
      : isPickup
        ? ({ preparing:'Pesanan sedang disiapkan oleh cabang.', ready_for_pickup:'Pesanan sudah siap. Periksa WhatsApp untuk PIN pengambilan.', picked_up:'Pesanan sudah diserahkan.' } as Record<string,string>)[order.fulfillment_status ?? ''] ?? 'Pesanan sedang diproses.'
        : shippingProgressLabel(order.shipping?.status)

  return { steps, currentIndex, currentDescription }
}

function RefundCard({ order }: { order: TrackingOrder }) {
  if (!order.refund_status || order.refund_status === 'none') return null

  const isCompleted = ['completed','partial','full'].includes(order.refund_status)
  const isProcessing = order.refund_status === 'processing'
  const type = order.refund_type ?? (['partial','full'].includes(order.refund_status) ? order.refund_status : null)
  const progress = isCompleted ? 3 : isProcessing ? 2 : 1
  const steps: Array<[string, string | null]> = [
    ['Permintaan diterima', order.refund_requested_at],
    ['Transfer diproses', order.refund_processed_at],
    ['Refund selesai', order.refund_completed_at],
  ]

  return (
    <div style={{
      border:`1.5px solid ${isCompleted ? 'rgba(16,185,129,0.3)' : 'rgba(232,160,32,0.3)'}`,
      borderRadius:16, padding:18, marginBottom:20,
      background:'#fff',
    }}>
      <p style={{ fontSize:11, fontWeight:800, color:isCompleted?S.green:S.gold, letterSpacing:1.2, marginBottom:10 }}>STATUS REFUND</p>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ fontSize:20 }}>{isCompleted ? '✅' : isProcessing ? '💳' : '⏳'}</span>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:S.dark }}>
            {isCompleted ? 'Refund Selesai' : isProcessing ? 'Refund Sedang Diproses' : 'Refund Menunggu Verifikasi'}
          </p>
          <p style={{ fontSize:11, color:S.gray }}>
            {type === 'full' ? 'Refund Penuh' : 'Refund Sebagian'} · Rp {Number(order.refund_amount).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:12 }}>
        {steps.map(([label, date], index) => {
          const done = index < progress
          return (
            <div key={label} style={{ flex:1, minWidth:0 }}>
              <div style={{ height:4, borderRadius:4, background:done ? S.green : S.grayL, marginBottom:5 }}/>
              <p style={{ fontSize:11, fontWeight:600, color:done ? S.dark : S.gray }}>{label}</p>
              {date && <p style={{ fontSize:11, color:S.gray, marginTop:2 }}>{date}</p>}
            </div>
          )
        })}
      </div>

      {(order.refund_request_number || order.refund_reason) && (
        <div style={{ fontSize:11, color:S.gray, marginBottom:10 }}>
          {order.refund_request_number && <p>Request: <strong style={{ color:S.dark }}>{order.refund_request_number}</strong></p>}
          {order.refund_reason && <p style={{ marginTop:3 }}>Alasan: {order.refund_reason}</p>}
        </div>
      )}

      {order.refund_calculation && (
        <div style={{ background:'#fff', border:`1px solid ${S.creamDp}`, borderRadius:8, padding:'9px 11px', marginBottom:10 }}>
          <p style={{ fontSize:11, fontWeight:700, color:S.gray, marginBottom:5 }}>RINCIAN PERHITUNGAN</p>
          {[
            ['Nilai item dibatalkan', order.refund_calculation.cancelled_items_gross],
            ['Alokasi diskon voucher', -order.refund_calculation.allocated_voucher_discount],
            order.refund_calculation.shipping_refunded
              ? ['Ongkir dikembalikan', order.refund_calculation.shipping_amount]
              : null,
            order.refund_calculation.shipping_refunded && order.refund_calculation.shipping_discount > 0
              ? ['Diskon ongkir', -order.refund_calculation.shipping_discount]
              : null,
          ].filter((row): row is [string, number] => row !== null).map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.gray, marginTop:3 }}>
              <span>{label}</span>
              <span>{value < 0 ? '−' : ''}{formatRupiah(Math.abs(value))}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:S.green, borderTop:`1px solid ${S.grayL}`, marginTop:6, paddingTop:6 }}>
            <span>Total refund</span>
            <span>{formatRupiah(order.refund_calculation.final_refund)}</span>
          </div>
        </div>
      )}

      {/* Info rekening */}
      {order.refund_bank_name && (
        <div style={{ background:'rgba(0,0,0,0.03)', borderRadius:8, padding:'10px 12px', marginBottom:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px', fontSize:12 }}>
            {[
              ['Bank', order.refund_bank_name],
              ['No. Rek', order.refund_account_number],
              ['Atas Nama', order.refund_account_name],
            ].map(([label, value]) => (
              <div key={label}>
                <span style={{ color:S.gray }}>{label}: </span>
                <span style={{ fontWeight:600, color:S.dark }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bukti transfer — tampil kalau sudah selesai */}
      {isCompleted && (order.refund_transfer_reference || order.refund_proof_url) && (
        <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'10px 12px' }}>
          <p style={{ fontSize:11, color:S.gray, marginBottom:4 }}>Bukti Transfer</p>
          {order.refund_transfer_reference && (
            <p style={{ fontSize:13, fontWeight:700, color:S.green, fontFamily:'monospace' }}>
              Ref: {order.refund_transfer_reference}
            </p>
          )}
          {order.refund_proof_url && (
            <a href={order.refund_proof_url} target="_blank" rel="noreferrer" style={{ display:'block', marginTop:8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.refund_proof_url}
                alt={`Bukti transfer refund ${order.order_number}`}
                style={{ display:'block', width:'100%', maxHeight:320, objectFit:'contain', borderRadius:8, background:'#fff' }}
              />
            </a>
          )}
          {order.refund_proof_note && (
            <p style={{ fontSize:11, color:S.gray, marginTop:4 }}>{order.refund_proof_note}</p>
          )}
          {order.refund_completed_at && (
            <p style={{ fontSize:11, color:S.gray, marginTop:4 }}>
              Selesai: {order.refund_completed_at}
            </p>
          )}
        </div>
      )}

      {isProcessing && (
        <p style={{ fontSize:11, color:'#92600A', marginTop:6 }}>
          ⏳ Admin sedang memproses transfer ke rekening kamu
        </p>
      )}

      {!isProcessing && !isCompleted && (
        <p style={{ fontSize:11, color:'#92600A', marginTop:6 }}>
          ⏳ Data refund sedang diverifikasi oleh admin
        </p>
      )}
    </div>
  )
}

export default function OrderTracking({ order }: { order: TrackingOrder }) {
  const isCancelled  = order.order_status === 'cancelled'
  const progress = orderProgress(order)
  const currentStep = progress.steps[progress.currentIndex]
  const summaryRows: Array<[string, number]> = [
    ['Subtotal', Number(order.subtotal)],
    ['Ongkir + Asuransi', Number(order.shipping_cost)],
  ]

  if (Number(order.voucher_discount) > 0) {
    summaryRows.push(['Voucher', -Number(order.voucher_discount)])
  }
  if (Number(order.shipping_discount) > 0) {
    summaryRows.push(['Diskon ongkir', -Number(order.shipping_discount)])
  }

  const shippingStatus = order.shipping
    ? [shippingProgressLabel(order.shipping.status), order.shipping.status === 'booking_failed' ? S.red : S.green]
    : null

  return (
    <div className="c-app" style={{ paddingTop:44, paddingBottom:60, maxWidth:560, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <p style={{ color:S.gold, fontSize:11, fontWeight:700, letterSpacing:3, marginBottom:6 }}>
          LACAK PESANAN
        </p>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(28px,5vw,38px)', fontWeight:700, color:S.navy, marginBottom:4 }}>
          {order.order_number}
        </h1>
        <p style={{ fontSize:13, color:S.gray }}>
          {order.branch?.name} · {order.created_at}
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:8, marginBottom:20 }}>
        {[
          ['Pembayaran', order.status_labels.payment, order.payment_status === 'paid' ? S.green : S.gold],
          ['Pesanan', order.status_labels.order, isCancelled ? S.red : S.navy],
          [order.fulfillment_type === 'pickup' ? 'Pengambilan' : 'Pengiriman', order.status_labels.fulfillment, S.navy],
        ].map(([label, value, color]) => (
          <div key={label} style={{ minWidth:0, background:'#fff', border:`1px solid ${S.creamDp}`, borderRadius:12, padding:'11px 10px' }}>
            <p style={{ fontSize:10, color:S.gray, marginBottom:4 }}>{label}</p>
            <p style={{ fontSize:11, lineHeight:1.35, fontWeight:800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status pesanan utama */}
      {!isCancelled ? (
        <div style={{ background:'#fff', borderRadius:16, padding:20, border:`1px solid ${S.creamDp}`, marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:800, color:S.red, letterSpacing:1.2, marginBottom:12 }}>STATUS PESANAN</p>

          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', borderRadius:12, background:'rgba(27,58,107,.055)', marginBottom:18 }}>
            <span style={{ display:'grid', placeItems:'center', width:42, height:42, borderRadius:12, background:S.navy, color:'#fff', fontSize:19, flexShrink:0 }}>{currentStep.icon}</span>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:S.navy }}>{currentStep.label}</p>
              <p style={{ fontSize:11, lineHeight:1.55, color:S.gray, marginTop:2 }}>{progress.currentDescription}</p>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:`repeat(${progress.steps.length}, 1fr)`, gap:4 }}>
            {progress.steps.map((step, index) => {
              const isCompleted = progress.currentIndex === progress.steps.length - 1
              const isDone = index < progress.currentIndex || (isCompleted && index === progress.currentIndex)
              const isCurrent = index === progress.currentIndex
              return (
                <div key={step.key} style={{ minWidth:0 }}>
                  <div style={{ height:5, borderRadius:99, background:isDone?S.green:isCurrent?S.red:S.grayL, marginBottom:7 }}/>
                  <p style={{ fontSize:11, lineHeight:1.3, fontWeight:isCurrent?800:600, color:isDone?S.green:isCurrent?S.red:S.gray }}>{step.label}</p>
                </div>
              )
            })}
          </div>

          {order.status_histories?.length > 0 && (
            <div style={{ borderTop:`1px solid ${S.grayL}`, marginTop:16, paddingTop:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:S.gray, marginBottom:6 }}>PEMBARUAN TERAKHIR</p>
              {[...order.status_histories].slice(-2).reverse().map((history, index) => (
                <div key={`${history.created_at}-${index}`} style={{ display:'flex', gap:8, fontSize:11, lineHeight:1.5, color:S.gray, marginTop:4 }}>
                  <span style={{ color:S.green }}>●</span>
                  <span><strong style={{ color:S.dark }}>{history.created_at}</strong> · {history.note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background:'rgba(196,30,58,0.04)', border:`1.5px solid rgba(196,30,58,0.2)`, borderRadius:16, padding:20, marginBottom:20 }}>
          <p style={{ fontSize:16, fontWeight:700, color:S.red, marginBottom:4 }}>✕ Pesanan Dibatalkan</p>
          {order.status_histories?.filter(h => h.status === 'cancelled').map((h, i) => (
            <p key={i} style={{ fontSize:12, color:S.gray }}>{h.note}</p>
          ))}
        </div>
      )}

      {order.review_url && (
        <div style={{ background:'linear-gradient(135deg,rgba(232,160,32,.14),rgba(196,30,58,.07))', border:'1px solid rgba(232,160,32,.35)', borderRadius:16, padding:18, marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:800, color:S.red, letterSpacing:1.1, marginBottom:6 }}>PESANAN SELESAI</p>
          <p style={{ fontSize:16, fontWeight:800, color:S.navy, marginBottom:4 }}>Bagaimana pengalamanmu?</p>
          <p style={{ fontSize:12, lineHeight:1.6, color:S.gray, marginBottom:14 }}>Penilaianmu membantu kami menjaga rasa dan pelayanan setiap cabang.</p>
          <a href={order.review_url} className="c-btn c-btn-primary c-btn-md c-btn-full">
            ★ Beri Penilaian
          </a>
        </div>
      )}

      {/* Refund berdiri sendiri, tidak dicampur ke status fulfillment */}
      <RefundCard order={order} />

      {/* Info Pengiriman */}
      {order.shipping && (
        <div style={{ background:'#fff', borderRadius:16, padding:20, border:`1px solid ${S.creamDp}`, marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:700, color:S.gray, letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>
            Info Pengiriman
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['Kurir', order.shipping.courier?.toUpperCase()],
              ['Layanan', order.shipping.service],
              ['Ongkir', formatRupiah(Number(order.shipping.base_cost))],
              ['Asuransi', formatRupiah(Number(order.shipping.insurance_fee))],
              ['Estimasi', order.shipping.estimated_days ? `${order.shipping.estimated_days} hari` : '—'],
              ['No. Resi', order.shipping.tracking_number ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ fontSize:11, color:S.gray, marginBottom:2 }}>{label}</p>
                <p style={{ fontSize:13, fontWeight:600, color: label === 'No. Resi' && value !== '—' ? S.navy : S.dark, fontFamily: label === 'No. Resi' ? 'monospace' : 'inherit' }}>
                  {value ?? '—'}
                </p>
                {label === 'No. Resi' && value !== '—' && (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(String(value))}
                    style={{ marginTop:4, border:0, background:'none', color:S.red, fontSize:11, fontWeight:700, padding:0 }}
                  >
                    Salin resi
                  </button>
                )}
              </div>
            ))}
          </div>
          {shippingStatus && (
            <div style={{ marginTop:12, padding:'10px 12px', borderRadius:8, background:S.grayL }}>
              <p style={{ fontSize:11, color:S.gray }}>Status Booking Pengiriman</p>
              <p style={{ fontSize:12, fontWeight:700, color:shippingStatus[1] }}>{shippingStatus[0]}</p>
              {order.shipping.booking_reference && (
                <p style={{ fontSize:11, color:S.gray, marginTop:2 }}>Referensi: {order.shipping.booking_reference}</p>
              )}
            </div>
          )}
          {order.shipping.address && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${S.grayL}` }}>
              <p style={{ fontSize:11, color:S.gray, marginBottom:4 }}>Alamat Pengiriman</p>
              <p style={{ fontSize:12, color:S.dark }}>{order.shipping.address}</p>
            </div>
          )}
        </div>
      )}

      {/* Ringkasan order */}
      <div style={{ background:'#fff', borderRadius:16, padding:20, border:`1px solid ${S.creamDp}` }}>
        <p style={{ fontSize:11, fontWeight:700, color:S.gray, letterSpacing:1, textTransform:'uppercase', marginBottom:12 }}>
          Ringkasan Pesanan
        </p>

        {order.items?.map(item => (
          <div key={item.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom:8, marginBottom:8, borderBottom:`1px solid ${S.grayL}`, opacity:item.is_removed ? 0.55 : 1 }}>
            <div>
              <p style={{ fontSize:13, fontWeight:500, textDecoration:item.is_removed ? 'line-through' : 'none' }}>{item.product_name}</p>
              <p style={{ fontSize:11, color:item.is_removed ? S.red : S.gray }}>
                {item.is_removed ? `Dibatalkan · ${item.removed_reason ?? 'Produk tidak tersedia'}` : `×${item.quantity} · ${formatRupiah(item.unit_price)}`}
              </p>
              {!item.is_removed && item.preparation_method && (
                <p style={{ fontSize:10, color:S.green, marginTop:2 }}>
                  {item.preparation_method === 'kukus' ? '♨️ Dikukus' : item.preparation_method === 'goreng' ? '🔥 Digoreng' : '❄️ Frozen'}
                </p>
              )}
            </div>
            <span style={{ fontSize:13, fontWeight:600, textDecoration:item.is_removed ? 'line-through' : 'none' }}>{formatRupiah(item.subtotal)}</span>
          </div>
        ))}

        {order.promotions?.length > 0 && (
          <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:9, padding:'9px 11px', margin:'10px 0' }}>
            <p style={{ fontSize:11, fontWeight:700, color:S.green, marginBottom:5 }}>PROMO DITERAPKAN</p>
            {order.promotions.map(promotion => (
              <div key={promotion.id} style={{ display:'flex', justifyContent:'space-between', gap:10, fontSize:11, color:S.dark, marginTop:3 }}>
                <span>{promotion.name} <span style={{ color:S.gray }}>({promotion.code})</span></span>
                <span style={{ color:S.green, fontWeight:600 }}>−{formatRupiah(promotion.discount_amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
          {summaryRows.map(([label, value]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray }}>
              <span>{label}</span>
              <span style={{ color: value < 0 ? S.green : 'inherit' }}>
                {value < 0 ? '−' : ''}{formatRupiah(Math.abs(value))}
              </span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:`2px solid ${S.navy}` }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Total Dibayar</span>
            <span style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:20, fontWeight:700, color:S.red }}>
              {formatRupiah(order.total)}
            </span>
          </div>
          {Number(order.refund_amount) > 0 && (
            <>
              <div style={{ marginTop:4, paddingTop:8, borderTop:`1px dashed ${S.creamDp}`, display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray }}>
                <span>Item yang tetap dipenuhi</span>
                <span>{formatRupiah(Number(order.fulfilled_subtotal))}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.red }}>
                <span>Item yang dibatalkan</span>
                <span>{formatRupiah(Number(order.cancelled_subtotal))}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.green }}>
                <span>Refund {order.refund_type === 'full' ? 'penuh' : 'sebagian'}</span>
                <span>−{formatRupiah(Number(order.refund_amount))}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:700, color:S.navy }}>
                <span>Total setelah refund</span>
                <span>{formatRupiah(Number(order.net_total))}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
