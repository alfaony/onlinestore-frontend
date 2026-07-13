'use client'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import { Turnstile } from '@marsidev/react-turnstile'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', gold:'#E8A020',
  creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB',
  dark:'#1A1A2E', green:'#10B981',
}

function apiErr(e: unknown, fallback: string): string {
  return axios.isAxiosError<{ message?: string }>(e)
    ? e.response?.data?.message ?? fallback
    : fallback
}

export default function LoginPage() {
  const router   = useRouter()
  const { token, setMember } = useMemberStore()

  // Redirect kalau sudah login
  useEffect(() => {
    if (token) router.replace('/account/profile')
  }, [token, router])

  const [step,           setStep]           = useState<'phone'|'otp'>('phone')
  const [phone,          setPhone]          = useState('')
  const [otp,            setOtp]            = useState('')
  const [name,           setName]           = useState('')
  const [loading,        setLoading]        = useState(false)
  const [timer,          setTimer]          = useState(0)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [phoneStatus,    setPhoneStatus]    = useState<'idle'|'new'|'exists'>('idle')
  const [checkingPhone,  setCheckingPhone]  = useState(false)

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timer])

  // Debounce cek nomor
  useEffect(() => {
    if (!phone || phone.length < 9) return
    const t = setTimeout(async () => {
      setCheckingPhone(true)
      try {
        const { data } = await api.post('/auth/check-phone', { phone: '0' + phone })
        setPhoneStatus(data.exists ? 'exists' : 'new')
      } catch { setPhoneStatus('idle') }
      finally { setCheckingPhone(false) }
    }, 600)
    return () => clearTimeout(t)
  }, [phone])

  const displayedPhoneStatus = phone.length >= 9 ? phoneStatus : 'idle'

  async function requestOtp() {
    if (!turnstileToken) { toast.error('Selesaikan verifikasi keamanan'); return }
    if (displayedPhoneStatus === 'new' && !name.trim()) { toast.error('Isi nama terlebih dahulu'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/request-otp', {
        phone:           '0' + phone,
        turnstile_token: turnstileToken,
      })
      setTurnstileToken('')
      setStep('otp')
      setTimer(60)
      if (res.data?.otp) toast.info(`Dev OTP: ${res.data.otp}`)
      else toast.success('Kode OTP dikirim ke WhatsApp')
    } catch (e) {
      toast.error(apiErr(e, 'Gagal mengirim OTP'))
      setTurnstileToken('')
    } finally { setLoading(false) }
  }

  async function verifyOtp() {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', {
        phone:    '0' + phone,
        otp_code: otp,
        name:     name || undefined,
      })
      setMember(data.member, data.token)
      toast.success(data.is_new ? 'Selamat datang! Akun berhasil dibuat 🎉' : 'Berhasil masuk!')
      router.replace('/account/profile')
    } catch (e) {
      toast.error(apiErr(e, 'OTP tidak valid'))
    } finally { setLoading(false) }
  }

  return (
    <div className="c-app account-login-page">

      {/* Brand */}
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:700, color:S.navy }}>
          Seraso
        </div>
        <p style={{ fontSize:13, color:S.gray, marginTop:4 }}>Masuk atau daftar dengan WhatsApp</p>
      </div>

      <div className="account-login-card">

        {step === 'phone' ? (
          <>
            <h2 style={{ fontSize:20, fontWeight:700, color:S.dark, marginBottom:4 }}>Masuk / Daftar</h2>
            <p style={{ fontSize:12, color:S.gray, marginBottom:22 }}>Masukkan nomor WhatsApp aktif kamu</p>

            {/* Phone input */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Nomor WhatsApp</label>
              <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${S.creamDp}`, borderRadius:10, overflow:'hidden' }}>
                <span style={{ padding:'11px 12px', background:S.grayL, fontSize:13, color:S.gray, borderRight:`1px solid ${S.creamDp}`, flexShrink:0 }}>+62</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="8xxxxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g,'').replace(/^0/,''))}
                  style={{ flex:1, padding:'11px 12px', border:'none', outline:'none', fontSize:14, fontWeight:500, background:'transparent' }}
                />
                {checkingPhone && <span style={{ padding:'0 12px', color:S.gray, fontSize:12 }}>⟳</span>}
              </div>

              {/* Status nomor */}
              {!checkingPhone && displayedPhoneStatus === 'exists' && (
                <div style={{ marginTop:8, padding:'7px 12px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, fontSize:11, color:S.green }}>
                  ✓ Nomor terdaftar — kamu akan masuk sebagai member
                </div>
              )}
              {!checkingPhone && displayedPhoneStatus === 'new' && (
                <div style={{ marginTop:8, padding:'7px 12px', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', borderRadius:8, fontSize:11, color:'#92600A' }}>
                  📝 Nomor baru — akun akan dibuat otomatis
                </div>
              )}
            </div>

            {/* Nama — hanya kalau nomor baru */}
            {displayedPhoneStatus === 'new' && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
                  Nama Kamu *
                </label>
                <input
                  className="c-input"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Turnstile */}
            <div className="account-turnstile">
              <Turnstile
                className="account-turnstile-widget"
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={t => setTurnstileToken(t)}
                onExpire={() => setTurnstileToken('')}
                onError={() => { setTurnstileToken(''); toast.error('Verifikasi gagal, refresh halaman') }}
                options={{ theme:'light', language:'id', size:'flexible' }}
              />
            </div>

            <button
              onClick={requestOtp}
              disabled={loading || checkingPhone || !turnstileToken || phone.length < 9 || displayedPhoneStatus === 'idle' || (displayedPhoneStatus === 'new' && !name.trim())}
              className="c-btn c-btn-primary c-btn-lg c-btn-full">
              {loading ? '⟳ Mengirim...' : 'Kirim Kode OTP via WhatsApp'}
            </button>

            <p style={{ fontSize:11, color:S.gray, textAlign:'center', marginTop:12, lineHeight:1.6 }}>
              Dengan melanjutkan, kamu menyetujui syarat dan kebijakan privasi Seraso
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => { setStep('phone'); setOtp('') }}
              style={{ background:'none', border:'none', color:S.gray, fontSize:12, cursor:'pointer', marginBottom:16, padding:0, display:'flex', alignItems:'center', gap:4 }}>
              ← Ganti Nomor
            </button>

            <h2 style={{ fontSize:20, fontWeight:700, color:S.dark, marginBottom:4 }}>Masukkan Kode OTP</h2>
            <p style={{ fontSize:12, color:S.gray, marginBottom:6 }}>
              Kode dikirim ke WhatsApp <strong>+62{phone}</strong>
            </p>
            <p style={{ fontSize:11, color:S.gray, marginBottom:22 }}>Berlaku selama 5 menit</p>

            {/* OTP boxes */}
            <div style={{ marginBottom:20 }}>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                autoFocus
                placeholder="000000"
                className="account-otp-input"
                data-complete={otp.length === 6}
              />
            </div>

            <button
              onClick={verifyOtp}
              disabled={loading || otp.length < 6}
              className="c-btn c-btn-primary c-btn-lg c-btn-full"
              style={{ marginBottom:12 }}>
              {loading ? '⟳ Memverifikasi...' : 'Verifikasi & Masuk'}
            </button>

            {/* Resend */}
            <div style={{ textAlign:'center' }}>
              {timer > 0 ? (
                <p style={{ fontSize:12, color:S.gray }}>Kirim ulang dalam <strong>{timer}s</strong></p>
              ) : (
                <button
                  onClick={() => {
                    setStep('phone')
                    setOtp('')
                    toast.info('Selesaikan verifikasi keamanan untuk meminta kode baru.')
                  }}
                  disabled={loading}
                  style={{ background:'none', border:'none', color:S.red, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  Minta kode baru
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
