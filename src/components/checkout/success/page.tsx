'use client'
import { useCartStore } from '@/stores/cart.store'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'

const S = {
  navy:'#1B3A6B', red:'#C41E3A',
  gray:'#6B7280', grayL:'#F3F0EB', creamDp:'#EDD9B8', green:'#10B981',
}

function SuccessContent() {
  const params       = useSearchParams()
  const ordersParam  = params.get('orders') ?? ''
  const orderNumbers = ordersParam.split(',').filter(Boolean)
  const clearCart    = useCartStore(s => s.clearCart)

  // ✅ clearCart di sini — setelah berhasil sampai ke halaman ini
  useEffect(() => {
    clearCart()
  }, [])

  return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'64px 16px', textAlign:'center' }}>

      {/* Icon animasi */}
      <div className="animate-fade-up" style={{
        width:96, height:96,
        background:'rgba(16,185,129,0.12)',
        borderRadius:'50%',
        display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 24px', fontSize:48,
      }}>
        ✅
      </div>

      <h1 className="animate-fade-up-2" style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontSize:'clamp(32px,5vw,42px)',
        fontWeight:700, color:S.navy, marginBottom:8,
      }}>
        Pesanan Berhasil!
      </h1>

      <p className="animate-fade-up-3" style={{ color:S.gray, fontSize:14, marginBottom:28 }}>
        {orderNumbers.length > 1
          ? `${orderNumbers.length} pesanan sedang diproses oleh masing-masing cabang.`
          : 'Pesananmu sedang diproses oleh tim kami.'
        }
      </p>

      {/* Order numbers */}
      <div style={{
        background:'#fff', borderRadius:16, padding:22,
        border:`1px solid ${S.creamDp}`, marginBottom:24,
      }}>
        <p style={{ fontSize:12, color:S.gray, marginBottom:10 }}>
          {orderNumbers.length > 1 ? 'Nomor Pesanan' : 'Nomor Pesanan'}
        </p>

        {orderNumbers.length === 0 ? (
          <p style={{ fontSize:13, color:S.gray }}>Memuat...</p>
        ) : orderNumbers.map((num, i) => (
          <div key={num} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 12px', background:S.grayL, borderRadius:8,
            marginBottom: i < orderNumbers.length-1 ? 6 : 0,
          }}>
            <span style={{
              fontFamily:'monospace', fontSize:13,
              fontWeight:700, color:S.navy,
            }}>
              {num}
            </span>
            <Link href={`/order/${num}`} style={{
              fontSize:11, color:S.red, fontWeight:600,
            }}>
              Lacak →
            </Link>
          </div>
        ))}

        <p style={{ fontSize:11, color:S.gray, marginTop:12 }}>
          📱 Notifikasi dikirim ke WhatsApp kamu
        </p>

        <div style={{
          background:S.grayL, borderRadius:8,
          padding:'10px 14px', marginTop:10,
        }}>
          <p style={{ fontSize:11, color:S.gray, marginBottom:2 }}>Status saat ini</p>
          <p style={{ fontSize:13, fontWeight:600, color:S.green }}>
            ✓ Pembayaran Diterima
          </p>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {orderNumbers.length === 1 ? (
          <Link href={`/order/${orderNumbers[0]}`}
            className="c-btn c-btn-primary c-btn-lg c-btn-full">
            🔍  Lacak Pesanan
          </Link>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {orderNumbers.map(num => (
              <Link key={num} href={`/order/${num}`}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 16px', background:'rgba(196,30,58,0.06)',
                  border:'1px solid rgba(196,30,58,0.2)', borderRadius:10,
                  fontSize:13, color:S.red, fontWeight:500, textDecoration:'none',
                }}>
                <span>🔍 Lacak {num}</span>
                <span>→</span>
              </Link>
            ))}
          </div>
        )}
        <Link href="/menu" className="c-btn c-btn-outline c-btn-lg c-btn-full">
          Pesan Lagi →
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign:'center', padding:64 }}>
        <span className="animate-spin" style={{ display:'inline-block', fontSize:24 }}>⟳</span>
      </div>
    }>
      <SuccessContent/>
    </Suspense>
  )
}