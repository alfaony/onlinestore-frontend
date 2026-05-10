// frontend/src/components/checkout/OTPModal.tsx
'use client'
import { useState } from 'react'
import { useMemberStore } from '@/stores/member.store'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
    open: boolean; phone: string
    onClose: () => void; onVerified: () => void
}

export default function OTPModal({ open, phone, onClose, onVerified }: Props) {
    const setMember = useMemberStore(s => s.setMember)
    const [step, setStep] = useState<'phone' | 'otp'>('phone')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [sent, setSent] = useState(false)

    async function requestOtp() {
        setLoading(true); setError('')
        try {
            await api.post('/auth/request-otp', { phone })
            setSent(true); setStep('otp')
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Gagal kirim OTP.')
        } finally { setLoading(false) }
    }

    async function verifyOtp() {
        setLoading(true); setError('')
        try {
            const { data } = await api.post('/auth/verify-otp', { phone, otp_code: otp })
            setMember(data.member, data.token)
            onVerified()
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'OTP tidak valid.')
        } finally { setLoading(false) }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                {step === 'phone' ? (
                    <>
                        <h2 className="font-playfair text-xl font-bold text-[--color-primary] mb-1">
                            Verifikasi WhatsApp
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Kita kirim kode OTP ke nomor WhatsApp kamu
                        </p>
                        <p className="text-sm font-medium text-gray-700 mb-4 bg-amber-50 px-3 py-2 rounded-lg">
                            {phone}
                        </p>
                        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
                            <Button className="flex-1 bg-[--color-primary] text-white"
                                onClick={requestOtp} disabled={loading}>
                                {loading ? 'Mengirim...' : 'Kirim OTP'}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="font-playfair text-xl font-bold text-[--color-primary] mb-1">
                            Masukkan Kode OTP
                        </h2>
                        <p className="text-sm text-gray-500 mb-5">
                            Kode dikirim ke WhatsApp <strong>{phone}</strong>. Berlaku 5 menit.
                        </p>
                        <Input
                            className="text-center text-2xl tracking-widest font-mono mb-3 h-14"
                            maxLength={6} placeholder="000000"
                            value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} />
                        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                        <Button className="w-full bg-[--color-primary] text-white rounded-xl h-12"
                            onClick={verifyOtp} disabled={loading || otp.length < 6}>
                            {loading ? 'Memverifikasi...' : 'Verifikasi'}
                        </Button>
                        <button onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                            className="w-full text-xs text-gray-400 mt-3 hover:text-gray-600">
                            Kirim ulang OTP
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}