// src/components/checkout/ShippingOptions.tsx
'use client'
import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import api from '@/lib/api'

const S = {
  red: '#C41E3A', navy: '#1B3A6B', creamDp: '#EDD9B8',
  gray: '#6B7280', grayL: '#F3F0EB', dark: '#1A1A2E',
  green: '#10B981', creamD: '#F5EDD9',
}

interface Rate {
  courier: string
  courier_name: string
  service: string
  service_name: string
  price: number
  etd: string
}

interface Props {
  address: any
  branchId: string
  onSelect: (r: Rate) => void
}

export default function ShippingOptions({ address, branchId, onSelect }: Props) {
  const [rates, setRates] = useState<Rate[]>([])
  const [selected, setSelected] = useState<Rate | null>(null)
  const [loading, setLoading] = useState(false)
  const [isMock, setIsMock] = useState(false)

  const items = useCartStore(s =>
    s.items.filter(i => i.branchId === branchId)
  )

  useEffect(() => {
    if (!address?.postal_code || !branchId) return
    fetchRates()
  }, [address?.postal_code, branchId])

  async function fetchRates() {
    setLoading(true)
    setRates([]); setSelected(null)
    try {
      const { data } = await api.post('/shipping/rates', {
        branch_id: branchId,
        destination_postal: address.postal_code,
        items: items.map(i => ({
          name: i.name,
          value: i.price,
          weight: 500,       // gram default, update sesuai product
          quantity: i.qty,
        })),
      })

      const pricing: Rate[] = data.pricing ?? []
      setRates(pricing)
      setIsMock(data.is_mock ?? false)

      // Auto-select yang paling murah
      if (pricing.length > 0) {
        const cheapest = [...pricing].sort((a, b) => a.price - b.price)[0]
        setSelected(cheapest)
        onSelect(cheapest)
      }
    } catch {
      // Fallback mock
      const mock: Rate[] = [
        { courier: 'jne', courier_name: 'JNE', service: 'REG', service_name: 'Reguler', price: 20000, etd: '2-3' },
      ]
      setRates(mock); setIsMock(true)
      setSelected(mock[0]); onSelect(mock[0])
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(rate: Rate) {
    setSelected(rate)
    onSelect(rate)
  }

  if (!address) return (
    <div style={{ padding: '10px 14px', background: S.grayL, borderRadius: 10, fontSize: 12, color: S.gray }}>
      ⚠️ Pilih alamat terlebih dahulu
    </div>
  )

  if (!address.postal_code) return (
    <div style={{ padding: '10px 14px', background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.2)', borderRadius: 10, fontSize: 12, color: '#92600A' }}>
      ⚠️ Isi kode pos di form alamat untuk melihat tarif pengiriman
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: S.gray, fontWeight: 500 }}>🚚 Pilih Kurir</label>
        {isMock && (
          <span style={{ fontSize: 10, background: 'rgba(232,160,32,0.12)', color: '#92600A', padding: '2px 8px', borderRadius: 10 }}>
            Estimasi — Biteship aktif saat deploy
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, background: S.grayL, borderRadius: 10, fontSize: 12, color: S.gray }}>
          <span className="animate-spin" style={{ display: 'inline-block' }}>⟳</span>
          Mengambil tarif dari Biteship...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rates.map((rate, i) => {
            const active = selected?.courier === rate.courier && selected?.service === rate.service
            return (
              <label key={`${rate.courier}_${rate.service}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1.5px solid ${active ? S.red : S.creamDp}`, borderRadius: 10, cursor: 'pointer', background: active ? 'rgba(196,30,58,0.04)' : '#fff', transition: 'all 0.18s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" name={`ship_${branchId}`} checked={active}
                    onChange={() => handleSelect(rate)}
                    style={{ accentColor: S.red, width: 16, height: 16 }} />
                  <div style={{ width: 36, height: 36, background: S.grayL, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    📦
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>
                      {rate.courier_name} — {rate.service_name}
                    </div>
                    <div style={{ fontSize: 11, color: S.gray }}>
                      Estimasi {rate.etd} hari
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: S.red }}>
                    {formatRupiah(rate.price)}
                  </div>
                  {i === 0 && (
                    <div style={{ fontSize: 10, color: S.green, fontWeight: 600 }}>Paling hemat</div>
                  )}
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}