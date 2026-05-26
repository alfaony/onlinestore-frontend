'use client'
import Link from 'next/link'
import type { Order } from '@/types'
import { formatRupiah } from '@/lib/utils'

const S = { red:'#C41E3A', navy:'#1B3A6B', gold:'#E8A020', creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB', grayM:'#E5E2DC', dark:'#1A1A2E', green:'#10B981', creamD:'#F5EDD9' }

const STATUS_STEPS = [
  { key:'pending',    label:'Menunggu Pembayaran' },
  { key:'confirmed',  label:'Dikonfirmasi Cabang' },
  { key:'processing', label:'Sedang Diproses' },
  { key:'shipped',    label:'Dalam Pengiriman' },
  { key:'delivered',  label:'Pesanan Selesai' },
]
const STATUS_ORDER = STATUS_STEPS.map(s => s.key)

const STATUS_DISPLAY: Record<string,string> = {
  pending:'⏳ Menunggu Pembayaran', confirmed:'✅ Dikonfirmasi',
  processing:'🍳 Sedang Diproses', shipped:'🚚 Dalam Pengiriman', delivered:'✅ Selesai',
}

export default function OrderTracking({ order }: { order: Order }) {
  const idx         = STATUS_ORDER.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="c-app" style={{ maxWidth:720, paddingTop:44, paddingBottom:60 }}>
      <Link href="/" style={{ color:S.gray, fontSize:13, display:'block', marginBottom:20 }}>← Kembali ke Beranda</Link>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ color:S.gold, fontSize:10, fontWeight:700, letterSpacing:3, marginBottom:4 }}>TRACKING PESANAN</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(32px,5vw,40px)', fontWeight:700, color:S.navy, marginBottom:4 }}>
            Status Pesanan
          </h1>
          <p style={{ color:S.gray, fontSize:12 }}>
            No. Order:{' '}
            <code style={{ background:S.grayL, padding:'2px 8px', borderRadius:5, fontSize:13, fontWeight:700, color:S.dark }}>
              {order.order_number}
            </code>
          </p>
        </div>
        {!isCancelled && (
          <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'12px 18px', textAlign:'center', flexShrink:0 }}>
            <p style={{ fontSize:10, color:S.gray, marginBottom:2 }}>Status Terkini</p>
            <p style={{ fontSize:13, fontWeight:700, color:S.green }}>{STATUS_DISPLAY[order.status] ?? order.status}</p>
          </div>
        )}
      </div>

      {/* ── Cancelled state ── */}
      {isCancelled && (
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px', background:'#FEE2E2', borderRadius:12, marginBottom:20, color:'#DC2626' }}>
          <span style={{ fontSize:20 }}>✕</span>
          <span style={{ fontWeight:600 }}>Pesanan dibatalkan</span>
        </div>
      )}

      {/* ── Timeline ── */}
      {!isCancelled && (
        <div style={{ background:'#fff', borderRadius:18, padding:28, border:`1px solid ${S.creamDp}`, marginBottom:20, position:'relative' }}>
          {/* Track line background */}
          <div style={{ position:'absolute', left:42, top:50, bottom:50, width:2, background:S.grayM }}/>
          {/* Track line progress */}
          <div style={{ position:'absolute', left:42, top:50, width:2, background:S.green, transition:'height 0.6s ease', height:`${Math.max(0,(idx/(STATUS_STEPS.length-1))*100)}%` }}/>

          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            {STATUS_STEPS.map((s, i) => {
              const done    = i <= idx
              const current = i === idx
              return (
                <div key={s.key} style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background: done ? S.green : S.grayL, border:`2px solid ${done ? S.green : S.grayM}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1, transition:'all 0.3s', boxShadow: current ? `0 0 0 4px rgba(16,185,129,0.15)` : 'none' }}>
                    {done ? <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>✓</span>
                           : <div style={{ width:8, height:8, borderRadius:'50%', background:S.grayM }}/>
                    }
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:14, fontWeight: done ? 600 : 400, color: done ? S.dark : S.gray }}>
                        {s.label}
                      </span>
                      {current && (
                        <span style={{ fontSize:10, color:S.red, fontWeight:600, background:'rgba(196,30,58,0.1)', padding:'2px 8px', borderRadius:10 }}>
                          Saat ini
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Shipping info ── */}
      {order.shipping?.tracking_number && (
        <div style={{ background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', borderRadius:12, padding:16, marginBottom:20 }}>
          <p style={{ color:S.gold, fontWeight:700, fontSize:13, marginBottom:10 }}>🚚 Info Pengiriman</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[['Kurir',order.shipping.courier],['No. Resi',order.shipping.tracking_number],['Estimasi',`${order.shipping.estimated_days??'-'} hari`]].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:10, color:S.gray }}>{k}</div>
                <div style={{ fontSize:13, fontWeight:600, color:S.dark }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detail grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:16, marginBottom:16 }}>
        <div style={{ background:'#fff', borderRadius:14, padding:18, border:`1px solid ${S.creamDp}` }}>
          <p style={{ fontSize:10, color:S.gray, fontWeight:700, letterSpacing:1, marginBottom:12 }}>PRODUK DIPESAN</p>
          {order.items?.map(item => (
            <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>🍜</span>
              <p style={{ flex:1, fontSize:12, fontWeight:500 }}>{item.product_name} <span style={{ color:S.gray }}>× {item.quantity}</span></p>
              <span style={{ fontSize:12, color:S.red, fontWeight:600 }}>{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:14, padding:18, border:`1px solid ${S.creamDp}` }}>
          <p style={{ fontSize:10, color:S.gray, fontWeight:700, letterSpacing:1, marginBottom:12 }}>RINGKASAN BIAYA</p>
          {[['Ongkos Kirim', formatRupiah(order.shipping_cost??0)],
            ...(order.voucher_discount > 0 ? [['Diskon Voucher', `− ${formatRupiah(order.voucher_discount)}`]] : []),
          ].map(([k,v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:12, color:S.gray }}>{k}</span>
              <span style={{ fontSize:12, fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:`1.5px solid ${S.creamDp}` }}>
            <span style={{ fontWeight:600, fontSize:13 }}>Total</span>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:700, color:S.red }}>{formatRupiah(order.total)}</span>
          </div>
        </div>
      </div>

      {/* WA notif banner */}
      <div style={{ display:'flex', gap:10, alignItems:'center', background:'rgba(27,58,107,0.06)', border:'1px solid rgba(27,58,107,0.1)', borderRadius:12, padding:'14px 16px' }}>
        <span style={{ fontSize:20 }}>📱</span>
        <p style={{ fontSize:12, color:S.navy }}>
          Notifikasi status pesanan dikirim ke WhatsApp kamu secara otomatis di setiap tahap pengiriman.
        </p>
      </div>
    </div>
  )
}
