'use client'

import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import Modal from '@/components/ui/Modal'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const S = { red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8', gray:'#6B7280', green:'#10B981' }

interface Props {
  open: boolean
  phone: string
  name: string
  email?: string
  onClose: () => void
  onVerified: () => void
}

function errorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}

export default function OTPModal({ open, phone, name, email, onClose, onVerified }: Props) {
  const setMember = useMemberStore(s => s.setMember)
  const [step, setStep] = useState<'phone'|'otp'>('phone')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  function startTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimer(60)
    intervalRef.current = setInterval(() => {
      setTimer(current => {
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  async function requestOtp() {
    setLoading(true)
    try {
      const response = await api.post('/auth/request-otp', { phone })
      setStep('otp')
      startTimer()
      if (response.data?.otp) {
        toast.info(`Kode OTP development: ${response.data.otp}`, { description: 'Gunakan kode ini untuk verifikasi lokal.' })
      } else {
        toast.success('Kode OTP dikirim', { description: `Periksa WhatsApp ${phone}.` })
      }
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'Gagal mengirim OTP.'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', {
        phone,
        otp_code: otp,
        name: name.trim(),
        email: email?.trim() || null,
      })
      setMember(data.member, data.token)
      toast.success(`Selamat datang, ${data.member.name}`, {
        description: 'Nomor WhatsApp berhasil diverifikasi.',
      })
      onVerified()
    } catch (error: unknown) {
      toast.error(errorMessage(error, 'OTP tidak valid.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="otp-modal-title" maxWidth={400}>
      <div style={{ padding: 26 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:20 }}>
          <div>
            <span style={{ display:'inline-flex', padding:'4px 8px', borderRadius:99, background:'rgba(27,58,107,.08)', color:S.navy, fontSize:11, fontWeight:700, letterSpacing:'.08em', marginBottom:8 }}>
              LANGKAH {step === 'phone' ? '1' : '2'} DARI 2
            </span>
            <h2 id="otp-modal-title" style={{ fontFamily:'var(--font-display)', fontSize:28, lineHeight:1.05, fontWeight:700, color:S.navy }}>
              {step === 'phone' ? 'Verifikasi WhatsApp' : 'Masukkan kode OTP'}
            </h2>
            <p style={{ fontSize:12, lineHeight:1.6, color:S.gray, marginTop:6 }}>
              {step === 'phone' ? 'Kami akan mengirim kode keamanan ke' : 'Kode enam digit telah dikirim ke'} <strong>{phone}</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup modal" style={{ width:34, height:34, borderRadius:10, border:0, background:'#F3F0EB', color:S.gray, fontSize:17, flexShrink:0 }}>×</button>
        </div>

        {step === 'phone' ? (
          <>
            <div style={{ padding:'11px 13px', borderRadius:10, background:'rgba(16,185,129,.07)', color:'#166534', fontSize:12, marginBottom:18 }}>
              ✓ Akun akan terdaftar atas nama <strong>{name}</strong>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={onClose} className="c-btn c-btn-ghost c-btn-md" style={{ flex:1 }}>Batal</button>
              <button type="button" onClick={requestOtp} disabled={loading} className="c-btn c-btn-primary c-btn-md" style={{ flex:2 }}>
                {loading ? 'Mengirim…' : 'Kirim kode OTP'}
              </button>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="otp-code" style={{ display:'block', fontSize:11, fontWeight:700, color:S.gray, marginBottom:6 }}>KODE VERIFIKASI</label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g,''))}
              placeholder="000000"
              style={{ width:'100%', padding:'14px 10px', borderRadius:12, border:`1.5px solid ${S.creamDp}`, fontSize:24, fontWeight:700, letterSpacing:10, textAlign:'center', marginBottom:8, fontFamily:'ui-monospace, monospace', outline:'none' }}
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, fontSize:11 }}>
              <span style={{ color:S.gray }}>Kode berlaku 5 menit</span>
              {timer > 0 ? (
                <span style={{ color:S.red, fontWeight:600 }}>Kirim ulang dalam {timer} detik</span>
              ) : (
                <button type="button" onClick={requestOtp} disabled={loading} style={{ background:'none', border:0, color:S.red, fontSize:11, fontWeight:700 }}>
                  Kirim ulang kode
                </button>
              )}
            </div>
            <button type="button" onClick={verifyOtp} disabled={otp.length < 6 || loading} className="c-btn c-btn-primary c-btn-lg c-btn-full">
              {loading ? 'Memverifikasi…' : 'Verifikasi & lanjutkan'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
