'use client'

import Modal from '@/components/ui/Modal'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import { Turnstile } from '@marsidev/react-turnstile'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import styles from './OTPModal.module.css'


const S = { red:'#C41E3A', gray:'#6B7280', green:'#10B981' }

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
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [phoneStatus, setPhoneStatus]       = useState<'idle'|'new'|'exists'>('idle')
  const [checkingPhone, setCheckingPhone]   = useState(false)
  const [otpPhone, setOtpPhone]             = useState('')

  // Nomor berubah setelah OTP sempat diminta (mis. user edit nomor lalu
  // buka modal lagi) — sesi OTP lama sudah tidak relevan, mulai dari awal.
  // (Adjust state saat render, bukan di effect — lihat react.dev/learn/you-might-not-need-an-effect.
  // Interval lama otomatis dibersihkan oleh startTimer()/resetModal() berikutnya.)
  if (step === 'otp' && phone !== otpPhone) {
    setStep('phone')
    setOtp('')
    setTimer(0)
    setError('')
  }

  useEffect(() => {
    if (!phone || phone.length < 9) return
    const t = setTimeout(async () => {
      setCheckingPhone(true)
      try {
        const { data } = await api.post('/auth/check-phone', { phone })
        setPhoneStatus(data.exists ? 'exists' : 'new')
      } catch {
        setPhoneStatus('idle')
      } finally {
        setCheckingPhone(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [phone])

  const displayedPhoneStatus = phone.length >= 9 ? phoneStatus : 'idle'

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

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  function resetModal() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setStep('phone')
    setOtp('')
    setOtpPhone('')
    setTimer(0)
    setTurnstileToken('')
    setError('')
  }

  function closeModal() {
    // Kalau OTP sudah pernah diminta (step 'otp'), jangan reset — biar saat
    // modal dibuka lagi, user langsung diarahkan ke form isi kode, bukan
    // request OTP baru (mencegah kena rate-limit & turnstile diminta ulang).
    if (step === 'phone') resetModal()
    onClose()
  }

  function prepareResend() {
    resetModal()
    toast.info('Selesaikan verifikasi keamanan untuk meminta kode baru.')
  }

  async function requestOtp() {
    if (!turnstileToken) { toast.error('Selesaikan verifikasi dulu'); return }
    setError('')
    setLoading(true)
    try {
      const response = await api.post('/auth/request-otp', {
        phone,
        turnstile_token: turnstileToken,
      })
      setTurnstileToken('')
      setStep('otp')
      setOtpPhone(phone)
      startTimer()
      if (response.data?.otp) {
        toast.info(`OTP dev: ${response.data.otp}`)
      } else {
        toast.success('OTP dikirim ke WhatsApp')
      }
    } catch (error) {
      const message = errorMessage(error, 'Gagal mengirim OTP.')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setError('')
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
      resetModal()
      onVerified()
    } catch (error: unknown) {
      const message = errorMessage(error, 'OTP tidak valid.')
      setError(message)
      setOtp('')
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={closeModal} titleId="otp-modal-title" maxWidth={400} mobileSheet>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.stepBadge}>
              LANGKAH {step === 'phone' ? '1' : '2'} DARI 2
            </span>
            <div className={styles.progress} aria-hidden="true">
              <span data-active="true" />
              <span data-active={step === 'otp'} />
            </div>
            <h2 id="otp-modal-title" className={styles.title}>
              {step === 'phone' ? 'Verifikasi WhatsApp' : 'Masukkan kode OTP'}
            </h2>
            <p className={styles.description}>
              {step === 'phone' ? 'Kami akan mengirim kode keamanan ke' : 'Kode enam digit telah dikirim ke'} <strong>{phone}</strong>
            </p>
          </div>
          <button type="button" onClick={closeModal} aria-label="Tutup modal" className={styles.closeButton}>×</button>
        </div>

        {step === 'phone' ? (
          <>
            {/* Info status nomor */}
            {checkingPhone && (
              <p style={{ fontSize:11, color:S.gray, marginBottom:10 }}>Mengecek nomor...</p>
            )}
            {!checkingPhone && displayedPhoneStatus === 'exists' && (
              <div style={{ padding:'8px 12px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, fontSize:11, color:S.green, marginBottom:10 }}>
                ✓ Nomor terdaftar — kamu akan login sebagai member
              </div>
            )}
            {!checkingPhone && displayedPhoneStatus === 'new' && (
              <div style={{ padding:'8px 12px', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', borderRadius:8, fontSize:11, color:'#92600A', marginBottom:10 }}>
                📝 Nomor baru — akun akan dibuat otomatis
              </div>
            )}

            {/* Info nama — kalau ada */}
            {displayedPhoneStatus === 'new' && name && (
              <div style={{ padding:'11px 13px', borderRadius:10, background:'rgba(16,185,129,.07)', color:'#166534', fontSize:12, marginBottom:14 }}>
                ✓ Akun akan terdaftar atas nama <strong>{name}</strong>
              </div>
            )}

            {/* Cloudflare Turnstile */}
            <Turnstile
              className={styles.turnstile}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={token => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken('')}
              onError={() => { setTurnstileToken(''); toast.error('Verifikasi gagal, coba refresh') }}
              options={{ theme:'light', language:'id', size:'flexible' }}
            />

            {error && <p role="alert" className={styles.errorMessage}>{error}</p>}

            <div className={styles.actions}>
              <button type="button" onClick={closeModal} className="c-btn c-btn-ghost c-btn-md">Batal</button>
              <button type="button" onClick={requestOtp} disabled={loading || !turnstileToken} className="c-btn c-btn-primary c-btn-md">
                {loading ? 'Mengirim…' : 'Kirim kode OTP'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* OTP input — tidak berubah dari sebelumnya */}
            <label htmlFor="otp-code" className={styles.otpLabel}>KODE VERIFIKASI</label>
            <input
              id="otp-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={otp}
              onChange={event => setOtp(event.target.value.replace(/\D/g,''))}
              placeholder="000000"
              className={styles.otpInput}
              data-complete={otp.length === 6}
              aria-describedby="otp-help"
            />
            <div id="otp-help" className={styles.otpMeta}>
              <span style={{ color:S.gray }}>Kode berlaku selama 5 menit</span>
              {timer > 0 ? (
                <span style={{ color:S.red, fontWeight:600 }}>Kirim ulang dalam {timer} detik</span>
              ) : (
                <button type="button" onClick={prepareResend} disabled={loading} className={styles.resendButton}>
                  Minta kode baru
                </button>
              )}
            </div>
            {error && <p role="alert" className={styles.errorMessage}>{error}</p>}
            <button type="button" onClick={verifyOtp} disabled={otp.length < 6 || loading} className="c-btn c-btn-primary c-btn-lg c-btn-full">
              {loading ? 'Memverifikasi…' : 'Verifikasi & lanjutkan'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
