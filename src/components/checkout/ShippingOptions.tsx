'use client'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import { getPreparationMethods, type CartItem } from '@/stores/cart.store'
import { useEffect, useRef, useState } from 'react'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E',
  green:'#10B981', gold:'#E8A020',
}

export interface Rate {
  courier: string
  courier_name: string
  service: string
  service_name: string
  price: number
  etd: string
  insurance_fee: number   // ← tambah
  free_cooking: boolean   // ← tambah
  is_instant: boolean
}

interface Props {
  address: {
    postal_code?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
  branchId: string
  items: CartItem[]
  onSelect: (r: Rate | null) => void
}

const INSTANT_COURIERS = ['gosend', 'grab', 'lalamove', 'borzo', 'gojek']
const MAX_REGULAR_DELIVERY_DAYS = 3

function isInstantRate(rate: Rate): boolean {
  if (typeof rate.is_instant === 'boolean') return rate.is_instant

  return (
    INSTANT_COURIERS.some(k => rate.courier.toLowerCase().includes(k)) ||
    rate.service_name?.toLowerCase().includes('instant') ||
    rate.service_name?.toLowerCase().includes('same day')
  )
}

function getBestRate(rates: Rate[]): Rate {
  // 1. Instant dulu
  const instant = rates.find(isInstantRate)
  if (instant) return instant

  // 2. Tercepat (ETD terkecil), kalau sama → termurah
  return [...rates].sort((a, b) => {
    const etdA = parseInt(String(a.etd).split('-')[0]) || 99
    const etdB = parseInt(String(b.etd).split('-')[0]) || 99
    if (etdA !== etdB) return etdA - etdB
    return a.price - b.price
  })[0]
}


// ── Cache key helper ──────────────────────────────────────
function buildCacheKey(branchId: string, postal: string, items: CartItem[]): string {
  const totalWeight = items.reduce((s, i) => s + 500 * i.qty, 0)
  const capabilities = items.map(item => `${item.id}:${getPreparationMethods(item).join(',')}`).join('|')
  return `rates:v5:${branchId}:${postal}:${totalWeight}:${capabilities}`
}

// ── Session storage helpers ───────────────────────────────
function getCachedRates(key: string): Rate[] | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const { rates, exp } = JSON.parse(raw)
    if (Date.now() > exp) { sessionStorage.removeItem(key); return null }
    return rates
  } catch { return null }
}

function setCachedRates(key: string, rates: Rate[]) {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      rates,
      exp: Date.now() + 60 * 60 * 1000, // 1 jam
    }))
  } catch {}
}

function isEtdValid(etd: string): boolean {
  const parts = String(etd).split('-')
  const max = parseInt(parts[parts.length - 1]) || 99
  return max <= MAX_REGULAR_DELIVERY_DAYS
}

export default function ShippingOptions({ address, branchId, items, onSelect }: Props) {
  const [rates,    setRates]    = useState<Rate[]>([])
  const [selected, setSelected] = useState<Rate | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [isMock,   setIsMock]   = useState(false)
  const [rateMessage, setRateMessage] = useState<string | null>(null)
  const onSelectRef = useRef(onSelect)
  const itemsRef = useRef(items)
  const postalCode = address?.postal_code ?? null
  const latitude = address?.latitude ?? null
  const longitude = address?.longitude ?? null
  const itemsKey = items.map(item => `${item.id}:${item.qty}:${getPreparationMethods(item).join(',')}`).join('|')
  const allSupportFrozen = items.every(item => getPreparationMethods(item).includes('frozen'))

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!postalCode || !branchId) {
      onSelectRef.current(null)
      return
    }

    let cancelled = false
    const destinationPostal = postalCode

    async function loadRates() {
      // Keep state updates asynchronous relative to the effect invocation.
      await Promise.resolve()
      const currentItems = itemsRef.current
      const cacheKey = buildCacheKey(branchId, destinationPostal, currentItems)
      const cached = getCachedRates(cacheKey)

      if (cached?.length) {
        if (cancelled) return
        const best = getBestRate(cached)
        setRates(cached)
        setIsMock(false)
        setSelected(best)
        onSelectRef.current(best)
        return
      }

      setLoading(true)
      setRates([])
      setSelected(null)
      setRateMessage(null)
      onSelectRef.current(null)

      try {
        const { data } = await api.post('/shipping/rates', {
          branch_id: branchId,
          destination_postal: destinationPostal,
          destination_lat: latitude,
          destination_lng: longitude,
          items: currentItems.map(item => ({
            product_id: item.id,
            name: item.name,
            value: item.price,
            weight: 500,
            quantity: item.qty,
          })),
        })

        if (cancelled) return
        const pricing: Rate[] = (data.pricing ?? []).filter((rate: Rate) =>
          isEtdValid(rate.etd) && (allSupportFrozen || isInstantRate(rate))
        )
        setRates(pricing)
        setIsMock(data.is_mock ?? false)
        setRateMessage(data.message ?? null)

        if (pricing.length > 0) {
          if (!data.is_mock) setCachedRates(cacheKey, pricing)
          const best = getBestRate(pricing)
          setSelected(best)
          onSelectRef.current(best)
        }
      } catch {
        if (cancelled) return
        setRates([])
        setIsMock(false)
        setSelected(null)
        setRateMessage('Gagal mengambil pilihan kurir. Silakan coba lagi.')
        onSelectRef.current(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadRates()

    return () => {
      cancelled = true
    }
  }, [allSupportFrozen, branchId, itemsKey, latitude, longitude, postalCode])

  function handleSelect(rate: Rate) {
    setSelected(rate)
    onSelect(rate)
  }

  // ── Guards ──────────────────────────────────────────────
  if (!address) return (
    <div style={{ padding:'10px 14px', background:S.grayL, borderRadius:10, fontSize:12, color:S.gray }}>
      ⚠️ Pilih alamat terlebih dahulu
    </div>
  )

  if (!address.postal_code) return (
    <div style={{ padding:'10px 14px', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', borderRadius:10, fontSize:12, color:'#92600A' }}>
      ⚠️ Isi kode pos di alamat untuk melihat tarif pengiriman
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <label style={{ fontSize:12, color:S.gray, fontWeight:500 }}>🚚 Pilih Kurir</label>
        {isMock && (
          <span style={{ fontSize:11, background:'rgba(232,160,32,0.12)', color:'#92600A', padding:'2px 8px', borderRadius:10 }}>
            Estimasi — Biteship aktif saat deploy
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:14, background:S.grayL, borderRadius:10, fontSize:12, color:S.gray }}>
          <span className="animate-spin" style={{ display:'inline-block' }}>⟳</span>
          Mengambil tarif pengiriman...
        </div>
      )}

      {!loading && rates.length === 0 && (
        <div style={{ padding:'12px 14px', background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,0.2)', borderRadius:10, fontSize:12, color:'#92600A' }}>
          ⚠️ {rateMessage ?? (allSupportFrozen
            ? 'Kurir pengiriman tidak tersedia untuk area ini.'
            : 'Produk ini tidak tersedia Frozen, sehingga hanya dapat dikirim instant.')}
          <br/>Coba <strong>Ambil Sendiri (Pickup)</strong>, lengkapi titik lokasi, atau pilih alamat lain.
        </div>
      )}

      {!loading && rates.length > 0 && !allSupportFrozen && (
        <div style={{ padding:'9px 11px', marginBottom:8, background:'rgba(232,160,32,0.08)', borderRadius:9, fontSize:11, color:'#92600A' }}>
          ⚡ Keranjang berisi produk tanpa opsi Frozen. Hanya kurir instant yang tersedia.
        </div>
      )}

      {/* Rates list */}
      {!loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {rates.map(rate => {
            // ✅ pakai isSelected, bukan active
            const isSelected = selected?.courier === rate.courier && selected?.service === rate.service
            const instant    = isInstantRate(rate)

            return (
              <label
                key={`${rate.courier}_${rate.service}`}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'12px 14px',
                  border:`1.5px solid ${isSelected ? S.red : S.creamDp}`,
                  borderRadius:10, cursor:'pointer',
                  background: isSelected ? 'rgba(196,30,58,0.04)' : '#fff',
                  transition:'all 0.18s',
                }}>

                {/* Left — kurir info */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input
                    type="radio"
                    name={`ship_${branchId}`}
                    checked={isSelected}
                    onChange={() => handleSelect(rate)}
                    style={{ accentColor:S.red, width:16, height:16 }}
                  />
                  <div style={{ width:36, height:36, background:S.grayL, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                    {instant ? '⚡' : '📦'}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:S.dark }}>
                      {rate.courier_name} — {rate.service_name}
                    </div>
                    <div style={{ fontSize:11, color:S.gray }}>
                      {instant
                        ? 'Pengiriman hari ini'
                        : `Estimasi ${rate.etd} hari`
                      }
                    </div>
                  </div>
                </div>

                {/* Right — harga + badge */}
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:S.red }}>
                    {formatRupiah(rate.price + rate.insurance_fee)}
                  </div>
                  <div style={{ fontSize:11, color:S.gray }}>
                    Ongkir {formatRupiah(rate.price)} + 🛡️ {formatRupiah(rate.insurance_fee)}
                  </div>
                  {instant && (
                    <>
                      <div style={{ fontSize:11, color:S.gold, fontWeight:700 }}>⚡ Instant</div>
                      <div style={{ fontSize:11, color:rate.free_cooking ? S.green : S.gray, fontWeight:600 }}>
                        {rate.free_cooking ? '🍳 Gratis Masak' : '❄️ Dikirim Frozen'}
                      </div>
                    </>
                  )}
                  {!instant && rate === getBestRate(rates) && (
                    <div style={{ fontSize:11, color:S.green, fontWeight:600 }}>🚀 Tercepat</div>
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
