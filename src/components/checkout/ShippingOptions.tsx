// frontend/src/components/checkout/ShippingOptions.tsx
'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface Props {
    address: any; branchId: string
    onSelect: (shipping: any) => void
}

export default function ShippingOptions({ address, branchId, onSelect }: Props) {
    const [rates, setRates] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!address || !branchId) return
        fetchRates()
    }, [address, branchId])

    async function fetchRates() {
        setLoading(true); setError(''); setRates([])
        try {
            const { data } = await api.post('/shipping/rates', {
                branch_id: branchId,
                destination_lat: address.latitude,
                destination_lng: address.longitude,
                destination_area: address.address,
            })
            setRates(data.rates ?? [])
        } catch {
            setError('Gagal memuat pilihan pengiriman.')
        } finally { setLoading(false) }
    }

    function handleSelect(rate: any) {
        setSelected(rate)
        onSelect(rate)
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Pilih Pengiriman</h2>

            {loading && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengambil pilihan pengiriman...
                </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="space-y-2">
                {rates.map((rate, idx) => (
                    <button key={idx}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all
              ${selected?.courier === rate.courier && selected?.service === rate.service
                                ? 'border-[--color-primary] bg-red-50'
                                : 'border-gray-200 hover:border-amber-200'}`}
                        onClick={() => handleSelect(rate)}>
                        <div>
                            <p className="font-medium text-sm text-gray-800">
                                {rate.courier_name} — {rate.service_name}
                            </p>
                            <p className="text-xs text-gray-400">Estimasi {rate.duration} hari</p>
                        </div>
                        <span className="font-semibold text-[--color-primary] text-sm">
                            {formatRupiah(rate.price)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}