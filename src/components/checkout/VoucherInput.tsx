'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'

const S = { red:'#C41E3A', creamDp:'#EDD9B8', gray:'#6B7280', green:'#10B981' }

interface Props {
  subtotal: number
  memberStatus: string | null
  onApply: (v: any) => void
}

export default function VoucherInput({ subtotal, memberStatus, onApply }: Props) {
  const [code, setCode]       = useState('')
  const [voucher, setVoucher] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function check() {
    if (!code.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post('/vouchers/check', { code, subtotal, member_status: memberStatus })
      setVoucher(data); onApply(data)
      toast.success(`Voucher "${data.name}" berhasil diterapkan! 🎉`)
    } catch (e:any) {
      toast.error(e?.response?.data?.message ?? 'Voucher tidak valid.')
    } finally { setLoading(false) }
  }

  function remove() { setVoucher(null); setCode(''); onApply(null) }

  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:S.gray, fontWeight:500, marginBottom:8 }}>
        🏷️ Kode Voucher
      </label>

      {voucher ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:'12px 14px' }}>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#166534' }}>{voucher.name}</p>
            <p style={{ fontSize:12, color:S.green }}>Hemat {formatRupiah(voucher.discount_amount)}</p>
          </div>
          <button onClick={remove} style={{ background:'none', border:'none', color:'#E5E2DC', fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key==='Enter' && check()}
              placeholder="Masukkan kode voucher..."
              className="c-input"
              style={{ flex:1, textTransform:'uppercase', fontWeight:600, letterSpacing:'1px' }}
            />
            <button onClick={check} disabled={loading || !code} className="c-btn c-btn-primary c-btn-sm">
              {loading ? '...' : 'Pakai'}
            </button>
          </div>
          <p style={{ fontSize:10, color:S.gray, marginTop:6 }}>
            Coba: <code style={{ background:'#F3F0EB', padding:'1px 5px', borderRadius:3 }}>NEWMEMBER</code>{' '}
            <code style={{ background:'#F3F0EB', padding:'1px 5px', borderRadius:3 }}>SERASO10</code>{' '}
            <code style={{ background:'#F3F0EB', padding:'1px 5px', borderRadius:3 }}>FREEONGKIR</code>
          </p>
        </div>
      )}
    </div>
  )
}
