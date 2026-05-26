'use client'
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { useMemberStore } from '@/stores/member.store'
import api from '@/lib/api'

const S = { red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8', gray:'#6B7280', green:'#10B981' }

interface Props {
  open: boolean
  phone: string
  onClose: () => void
  onVerified: () => void
}

export default function OTPModal({ open, phone, onClose, onVerified }: Props) {
  const setMember = useMemberStore(s => s.setMember)
  const [step, setStep]     = useState<'phone'|'otp'>('phone')
  const [otp, setOtp]       = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer]   = useState(0)
  const iv = useRef<any>(null)

  async function requestOtp() {
    setLoading(true)
    try {
      const res = await api.post('/auth/request-otp', { phone })
      setStep('otp'); setTimer(60)
      iv.current = setInterval(() => setTimer(t => { if (t<=1){clearInterval(iv.current);return 0} return t-1 }),1000)
      if (res.data?.otp) toast.info(`[Dev] OTP: ${res.data.otp}`)
      else toast.success('OTP dikirim ke WhatsApp! 📱')
    } catch (e:any) { toast.error(e?.response?.data?.message ?? 'Gagal kirim OTP.')
    } finally { setLoading(false) }
  }

  async function verifyOtp() {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { phone, otp_code: otp })
      setMember(data.member, data.token)
      toast.success('Verifikasi berhasil! 🎉')
      if (data.is_new) toast.info('Voucher member baru sudah dikirim ke akun kamu.')
      onVerified()
    } catch (e:any) { toast.error(e?.response?.data?.message ?? 'OTP tidak valid.')
    } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300 }} className="animate-fade-in"/>
      <div style={{ position:'fixed', inset:0, zIndex:301, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 16px 16px' }}>
        <div className="animate-modal-in" style={{ background:'#fff', borderRadius:20, padding:28, width:'100%', maxWidth:380, boxShadow:'0 24px 64px rgba(0,0,0,0.18)' }}>
          {step === 'phone' ? (
            <>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:S.navy, marginBottom:6 }}>
                Verifikasi WhatsApp
              </h2>
              <p style={{ fontSize:12, color:S.gray, marginBottom:20 }}>
                Kode OTP akan dikirim ke <strong>{phone}</strong>
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={onClose} className="c-btn c-btn-ghost c-btn-md" style={{ flex:1 }}>Batal</button>
                <button onClick={requestOtp} disabled={loading} className="c-btn c-btn-primary c-btn-md" style={{ flex:2 }}>
                  {loading ? 'Mengirim...' : 'Kirim OTP via WA'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:700, color:S.navy, marginBottom:6 }}>
                Masukkan Kode OTP
              </h2>
              <p style={{ fontSize:12, color:S.gray, marginBottom:20 }}>
                Kode dikirim ke WhatsApp <strong>{phone}</strong>
              </p>
              <input
                maxLength={6} value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="○ ○ ○ ○ ○ ○"
                style={{ width:'100%', padding:'14px', borderRadius:12, border:`1.5px solid ${S.creamDp}`, fontSize:24, fontWeight:700, letterSpacing:12, textAlign:'center', marginBottom:8, fontFamily:'monospace', outline:'none', transition:'border 0.2s' }}
                onFocus={e => e.target.style.borderColor=S.red}
                onBlur={e => e.target.style.borderColor=S.creamDp}
              />
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20, fontSize:11 }}>
                <span style={{ color:S.gray }}>✅ Berlaku 5 menit</span>
                {timer > 0
                  ? <span style={{ color:S.red, fontWeight:600 }}>Kirim ulang {timer}s</span>
                  : <button onClick={() => setStep('phone')} style={{ background:'none', border:'none', color:S.red, fontSize:11, cursor:'pointer', fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      Kirim ulang OTP
                    </button>
                }
              </div>
              <button onClick={verifyOtp} disabled={otp.length<6 || loading}
                className="c-btn c-btn-primary c-btn-lg c-btn-full">
                {loading ? 'Memverifikasi...' : 'Verifikasi'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
