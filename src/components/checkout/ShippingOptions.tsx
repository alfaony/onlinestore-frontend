'use client'
import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'

const S = { red: '#C41E3A', navy: '#1B3A6B', creamDp: '#EDD9B8', gray: '#6B7280', grayL: '#F3F0EB', dark: '#1A1A2E', green: '#10B981', creamD: '#F5EDD9' }

// Mock rates — ganti dengan API call saat KiriminAja ready
const MOCK_RATES = [
  { courier: 'jne', courier_name: 'JNE', service: 'REG', service_name: 'Reguler', price: 20000, etd: '2-3' },
  { courier: 'jne', courier_name: 'JNE', service: 'YES', service_name: 'YES (Next Day)', price: 35000, etd: '1' },
  { courier: 'jnt', courier_name: 'J&T Express', service: 'EZ', service_name: 'Reguler', price: 22000, etd: '2-3' },
]

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
  const [selected, setSelected] = useState<Rate | null>(null)
  const [rates, setRates] = useState<Rate[]>([])

  useEffect(() => {
    if (!address || !branchId) return

    // TODO: Ganti dengan API call KiriminAja saat API key ready
    // const { data } = await api.post('/shipping/rates', { branch_id: branchId, destination_id: address.district_id })
    // setRates(data.rates)

    setRates(MOCK_RATES)

  }, [address, branchId])

  function handleSelect(rate: Rate) {
    setSelected(rate)
    onSelect(rate)
  }

  if (!address) return (
    <div style={{ padding: '10px 14px', background: S.grayL, borderRadius: 10, fontSize: 12, color: S.gray }}>
      ⚠️ Pilih alamat terlebih dahulu
    </div>
  )

  return (
    <div style={{ marginBottom: 8 }}>
      {/* TODO badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <label style={{ fontSize: 12, color: S.gray, fontWeight: 500 }}>🚚 Pilih Kurir</label>
        <span style={{ fontSize: 10, background: 'rgba(232,160,32,0.15)', color: '#92600A', padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
          Mock — KiriminAja API coming soon
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rates.map((rate, i) => {
          const active = selected?.courier === rate.courier && selected?.service === rate.service
          return (
            <label key={`${rate.courier}_${rate.service}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: `1.5px solid ${active ? S.red : S.creamDp}`, borderRadius: 10, cursor: 'pointer', background: active ? 'rgba(196,30,58,0.04)' : '#fff', transition: 'all 0.18s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name={`shipping_${branchId}`} checked={active} onChange={() => handleSelect(rate)} style={{ accentColor: S.red, width: 16, height: 16 }} />
                <div style={{ width: 36, height: 36, background: S.grayL, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{rate.courier_name} — {rate.service_name}</div>
                  <div style={{ fontSize: 11, color: S.gray }}>Estimasi {rate.etd} hari</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: S.red }}>{formatRupiah(rate.price)}</div>
                {i === 0 && <div style={{ fontSize: 10, color: S.green, fontWeight: 600 }}>Paling hemat</div>}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}