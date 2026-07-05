import { formatRupiah } from '@/lib/utils'
import type { CartItem } from '@/stores/cart.store'

const S = { red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8', gray:'#6B7280', grayM:'#E5E2DC', dark:'#1A1A2E', green:'#10B981', creamD:'#F5EDD9' }

interface Props {
  items: Array<Pick<CartItem, 'id' | 'name' | 'qty' | 'price'>>
  subtotal: number
  shippingCost: number
  shippingDiscount: number
  voucherDiscount: number
  total: number
}

export default function OrderSummary({ items, subtotal, shippingCost, shippingDiscount, voucherDiscount, total }: Props) {
  return (
    <div style={{ width:'100%', maxWidth:300, background:'#fff', borderRadius:16, padding:22, border:`1px solid ${S.creamDp}`, position:'sticky', top:80, alignSelf:'start', flexShrink:0 }}>
      <h3 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:21, color:S.navy, marginBottom:16 }}>Ringkasan</h3>

      {/* Items list */}
      <div style={{ maxHeight:180, overflowY:'auto', marginBottom:14 }}>
        {items.map(item => (
          <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:44, height:44, background:S.creamD, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🍜</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:S.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
              <div style={{ fontSize:11, color:S.gray }}>× {item.qty}</div>
            </div>
            <span style={{ fontSize:12, fontWeight:600, flexShrink:0 }}>{formatRupiah(item.price*item.qty)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ borderTop:`1px solid ${S.grayM}`, paddingTop:12 }}>
        {[['Subtotal', formatRupiah(subtotal)], ['Ongkos Kirim', shippingCost ? formatRupiah(shippingCost) : '—']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:6 }}>
            <span>{k}</span><span>{v}</span>
          </div>
        ))}
        {shippingDiscount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.green, marginBottom:6 }}>
            <span>Diskon Ongkir</span><span>− {formatRupiah(shippingDiscount)}</span>
          </div>
        )}
        {voucherDiscount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.green, marginBottom:6 }}>
            <span>Voucher</span><span>− {formatRupiah(voucherDiscount)}</span>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:`1.5px solid ${S.creamDp}` }}>
          <span style={{ fontWeight:600, fontSize:14, color:S.dark }}>Total Bayar</span>
          <span style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:22, fontWeight:700, color:S.red }}>
            {formatRupiah(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
