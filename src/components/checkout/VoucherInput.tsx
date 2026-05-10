// frontend/src/components/checkout/VoucherInput.tsx
'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tag, X } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import api from '@/lib/api'

interface Props {
    subtotal: number
    memberStatus: 'new' | 'old' | null
    onApply: (voucher: any) => void
}

export default function VoucherInput({ subtotal, memberStatus, onApply }: Props) {
    const [code, setCode] = useState('')
    const [voucher, setVoucher] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function checkVoucher() {
        if (!code.trim()) return
        setLoading(true); setError('')
        try {
            const { data } = await api.post('/vouchers/check', {
                code, subtotal, member_status: memberStatus
            })
            setVoucher(data)
            onApply(data)
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Voucher tidak valid.')
        } finally { setLoading(false) }
    }

    function removeVoucher() {
        setVoucher(null); setCode(''); onApply(null)
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[--color-accent]" />
                Voucher
            </h2>

            {voucher ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div>
                        <p className="font-medium text-sm text-green-800">{voucher.name}</p>
                        <p className="text-xs text-green-600">
                            Hemat {formatRupiah(voucher.discount_amount)}
                        </p>
                    </div>
                    <button onClick={removeVoucher}
                        className="text-green-400 hover:text-green-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Masukkan kode voucher"
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            className="font-mono"
                            onKeyDown={e => e.key === 'Enter' && checkVoucher()}
                        />
                        <Button
                            variant="outline"
                            className="border-[--color-primary] text-[--color-primary] shrink-0"
                            onClick={checkVoucher}
                            disabled={loading || !code}>
                            {loading ? '...' : 'Pakai'}
                        </Button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
            )}
        </div>
    )
}