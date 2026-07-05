'use client'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import {
  groupCartByBranch,
  useCartBranchCount,
  useCartItems,
  useCartStore,
  type BranchGroup
} from '@/stores/cart.store'
import { useMemberStore } from '@/stores/member.store'
import type { Branch, PromotionPreview } from '@/types'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AddressForm, { type AddressPayload } from './AddressForm'
import FulfillmentToggle, { type FulfillmentType } from './FulfillmentToggle'
import OTPModal from './OTPModal'
import PickupScheduler from './PickupScheduler'
import ShippingOptions, { type Rate } from './ShippingOptions'
import VoucherInput from './VoucherInput'


interface Props {
  onPaymentSuccess?: () => void
}

const S = {
  red: '#C41E3A', navy: '#1B3A6B', gold: '#E8A020',
  creamDp: '#EDD9B8', creamD: '#F5EDD9',
  gray: '#6B7280', grayL: '#F3F0EB', grayM: '#E5E2DC',
  dark: '#1A1A2E', green: '#10B981',
}

interface ApiErrorData {
  message?: string
  errors?: Record<string, string[]>
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorData>(error)) return fallback

  return error.response?.data?.errors?.promo_code?.[0]
    ?? error.response?.data?.errors?.items?.join(' ')
    ?? error.response?.data?.message
    ?? fallback
}

function stockIssuesFrom(error: unknown): string[] | null {
  if (!axios.isAxiosError<ApiErrorData>(error)) return null

  return error.response?.data?.errors?.items ?? null
}

// ─── Step Indicator ───────────────────────────────────────
const STEPS = [
  { n: '1', label: 'Verifikasi', sub: 'OTP WhatsApp', icon: '📱' },
  { n: '2', label: 'Alamat', sub: 'Lokasi Pengiriman', icon: '📍' },
  { n: '3', label: 'Pembayaran', sub: 'Promo & Konfirmasi', icon: '💳' },
]

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step > i ? S.green : step === i + 1 ? S.red : S.grayL,
                color: step >= i + 1 ? '#fff' : S.gray,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                boxShadow: step === i + 1 ? '0 0 0 4px rgba(196,30,58,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '✓' : step === i + 1 ? s.icon : s.n}
              </div>
              <div className="hidden sm:block">
                <div style={{ fontSize: 11, fontWeight: 600, color: step === i + 1 ? S.red : step > i ? S.green : S.gray }}>{s.label}</div>
                <div style={{ fontSize:11, color: S.gray }}>{s.sub}</div>
              </div>
            </div>
          </div>
          {i < 2 && <div style={{ flex: 0, width: 20, height: 2, background: step > i + 1 ? S.green : S.grayM, borderRadius: 1, margin: '0 4px', transition: 'background 0.3s' }} />}
        </div>
      ))}
    </div>
  )
}

// ─── Sidebar Summary ──────────────────────────────────────
function Sidebar({ grouped, shippings, preview, fulfillmentType }: {
  grouped: BranchGroup[]
  shippings: Record<string, Rate>
  preview: PromotionPreview | null
  fulfillmentType: FulfillmentType
}) {
  const totalItems     = grouped.reduce((s, g) => s + g.subtotal, 0)
  const totalShipping  = fulfillmentType === 'delivery' ? grouped.reduce((s, g) => s + (shippings[g.branchId]?.price ?? 0), 0) : 0
  const totalInsurance = fulfillmentType === 'delivery' ? grouped.reduce((s, g) => s + (shippings[g.branchId]?.insurance_fee ?? 0), 0) : 0
  const productDiscount = preview?.product_discount ?? 0
  const shippingDiscount = preview?.shipping_discount ?? 0
  const grand = preview?.grand_total ?? totalItems + totalShipping + totalInsurance

  return (
    <div className="checkout-summary" style={{ width: '100%', maxWidth: 290, background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${S.creamDp}`, position: 'sticky', top: 80, alignSelf: 'start', flexShrink: 0 }}>
      <h3>Ringkasan</h3>

      {grouped.map(({ branchId, branchName, items, subtotal }) => {
        const ship = shippings[branchId]
        return (
          <div key={branchId} style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${S.grayL}` }}>
            <p style={{ fontSize:11, fontWeight:600, color:S.navy, marginBottom:8 }}>📍 {branchName}</p>

            {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ width: 32, height: 32, background: S.creamD, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🍜</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: S.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name} × {item.qty}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{formatRupiah(item.price * item.qty)}</span>
            </div>
          ))}

            {/* ✅ Ganti baris "Ongkir" tunggal jadi breakdown */}
            {fulfillmentType === 'pickup' ? (
              <div style={{ fontSize:11, color:S.green, marginTop:6 }}>✓ Pickup di cabang · gratis pengiriman</div>
            ) : ship ? (
              <div style={{ marginTop:8, paddingTop:8, borderTop:`1px dashed ${S.grayL}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.gray, marginBottom:3 }}>
                  <span>Ongkir ({ship.courier_name})</span>
                  <span>{formatRupiah(ship.price)}</span>
                </div>
                {ship.insurance_fee > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.gray, marginBottom:3 }}>
                    <span>🛡️ Asuransi</span>
                    <span>{formatRupiah(ship.insurance_fee)}</span>
                  </div>
                )}
                {ship.free_cooking && (
                  <div style={{ fontSize:11, color:S.green, marginTop:4 }}>⚡🍳 Instant + Gratis Masak</div>
                )}
              </div>
            ) : (
              <div style={{ fontSize:11, color:S.gray, marginTop:6 }}>Ongkir — belum dipilih</div>
            )}
          </div>
        )
      })}

      {/* ✅ Total breakdown */}
      <div style={{ paddingTop:4 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:4 }}>
          <span>Subtotal Produk</span><span>{formatRupiah(totalItems)}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:4 }}>
          <span>Total Ongkir</span><span>{formatRupiah(totalShipping)}</span>
        </div>
        {totalInsurance > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:4 }}>
            <span>🛡️ Asuransi</span><span>{formatRupiah(totalInsurance)}</span>
          </div>
        )}
        {productDiscount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.green, marginBottom:4 }}>
            <span>Diskon Produk</span><span>− {formatRupiah(productDiscount)}</span>
          </div>
        )}
        {shippingDiscount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.green, marginBottom:4 }}>
            <span>Diskon Pengiriman</span><span>− {formatRupiah(shippingDiscount)}</span>
          </div>
        )}
        {preview?.applied_promotions.map(promo => (
          <div key={promo.id} style={{ fontSize:11, color:S.green, marginBottom:3 }}>✓ {promo.name}</div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:`1px solid ${S.creamDp}` }}>
          <span style={{ fontWeight:600, fontSize:13 }}>Total Bayar</span>
          <span style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:20, fontWeight:700, color:S.red }}>{formatRupiah(grand)}</span>
        </div>
      </div>
    </div>
  )
}
// ─── Main ─────────────────────────────────────────────────
export default function CheckoutFlow({ onPaymentSuccess }: Props) {
  const router = useRouter()

  const items = useCartItems()

  const branchCount = useCartBranchCount()
  const clearCart = useCartStore(s => s.clearCart)

  const grouped = useMemo(() => groupCartByBranch(items), [items])

  const { member, token } = useMemberStore()

  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState(member?.phone?.replace(/^(62|0)/, '') ?? '')
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState('')
  const [showOTP, setShowOTP] = useState(false)

  const [address, setAddress] = useState<AddressPayload | null>(null)
  const [shippings, setShippings] = useState<Record<string, Rate>>({})

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('delivery')
  const [pickupSchedule, setPickupSchedule] = useState<{ datetime: string; note: string } | null>(null)
  const [branches, setBranches] = useState<Branch[]>([])
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [promoResult, setPromoResult] = useState<{ key: string; preview: PromotionPreview } | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [stockIssues, setStockIssues] = useState<string[] | null>(null)

  const allShippingPicked = fulfillmentType === 'pickup' || grouped.every(g => !!shippings[g.branchId])
  const pricingReady = grouped.length > 0 && allShippingPicked
  const calculatedTotal = grouped.reduce((s, g) => {
    const ship = shippings[g.branchId]
    return s + g.subtotal + (fulfillmentType === 'delivery' ? (ship?.price ?? 0) + (ship?.insurance_fee ?? 0) : 0)
  }, 0)
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  const promoBranches = useMemo(() => grouped.map(group => {
    const shipping = shippings[group.branchId]

    return {
      branch_id: group.branchId,
      items: group.items.map(item => ({ product_id: item.id, quantity: item.qty })),
      shipping: fulfillmentType === 'delivery' && shipping ? {
        cost: shipping.price,
        insurance_fee: shipping.insurance_fee ?? 0,
        is_instant: shipping.is_instant ?? false,
      } : {
        cost: 0,
        insurance_fee: 0,
        is_instant: false,
      },
    }
  }), [fulfillmentType, grouped, shippings])

  const promoInputKey = useMemo(
    () => JSON.stringify({ promoCode, branches: promoBranches }),
    [promoBranches, promoCode]
  )
  const activePromoPreview = pricingReady && promoResult?.key === promoInputKey
    ? promoResult.preview
    : null
  const promoLoading = applyingPromo || (pricingReady && !activePromoPreview)
  const grandTotal = activePromoPreview?.grand_total ?? calculatedTotal

  const requestPromoPreview = useCallback(async (code: string | null) => {
    const { data } = await api.post<PromotionPreview>('/promotions/preview', {
      promo_code: code,
      branches: promoBranches,
    }, { headers: token ? { Authorization: `Bearer ${token}` } : {} })

    return data
  }, [promoBranches, token])


  useEffect(() => {
    api.get('/branches').then(({ data }) => setBranches(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    if (!pricingReady) return

    let cancelled = false
    requestPromoPreview(promoCode)
      .then(data => {
        if (!cancelled) setPromoResult({ key: promoInputKey, preview: data })
      })
      .catch(error => {
        if (cancelled) return

        if (promoCode) {
          toast.error(apiErrorMessage(error, 'Promo tidak lagi memenuhi syarat.'))
          setPromoCode(null)
        } else {
          setPromoResult(null)
        }
      })

    return () => { cancelled = true }
  }, [pricingReady, promoCode, promoInputKey, requestPromoPreview])

  async function applyPromo(code: string) {
    if (!pricingReady) {
      toast.error('Pilih pengiriman terlebih dahulu.')
      return false
    }

    setApplyingPromo(true)
    try {
      const preview = await requestPromoPreview(code)
      setPromoResult({
        key: JSON.stringify({ promoCode: code, branches: promoBranches }),
        preview,
      })
      setPromoCode(code)
      toast.success(`Promo ${code} berhasil diterapkan.`)
      return true
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'Kode promo tidak valid.'))
      return false
    } finally {
      setApplyingPromo(false)
    }
  }


  async function placeOrder() {
    if (fulfillmentType === 'delivery' && !address) { toast.error('Pilih alamat pengiriman'); return }
    if (fulfillmentType === 'delivery' && !allShippingPicked) { toast.error('Pilih kurir untuk semua cabang'); return }
    if (fulfillmentType === 'pickup' && !pickupSchedule) { toast.error('Pilih jadwal pickup'); return }
    setLoading(true)
    setStockIssues(null)
    try {
      const { data } = await api.post('/orders', {
        phone: '0' + phone,
        name,
        email,
        notes,
        promo_code: promoCode,
        fulfillment_type: fulfillmentType,  // ✅ tambah

        // Address hanya kalau delivery
        address: fulfillmentType === 'delivery' && address ? {
          address: address.address,
          detail: address.detail,
          province_name: address.province_name,
          regency_name: address.regency_name,
          district_name: address.district_name,
          village_name: address.village_name,
          postal_code: address.postal_code,
          latitude: address.latitude,
          longitude: address.longitude,
        } : null,

        // Pickup schedule kalau pickup
        pickup_scheduled_at: fulfillmentType === 'pickup' ? pickupSchedule?.datetime : null,
        pickup_note: fulfillmentType === 'pickup' ? pickupSchedule?.note : null,

        branches: grouped.map(g => {
          const shipping = shippings[g.branchId]

          return {
            branch_id: g.branchId,
            items: g.items.map(i => ({ product_id: i.id, quantity: i.qty, price: i.price })),
            shipping: fulfillmentType === 'delivery' && shipping ? {
              courier: shipping.courier,
              service: shipping.service,
              cost: shipping.price,
              insurance_fee: shipping.insurance_fee ?? 0,
              is_instant: shipping.is_instant ?? false,
              free_cooking: shipping.free_cooking ?? false,
            } : {
              courier: 'pickup', service: 'self', cost: 0, insurance_fee: 0, is_instant: false, free_cooking: false,
            },
          }
        }),
      }, { headers: authHeader })

      const { data: payment } = await api.post('/orders/payment/initiate', {
        order_numbers: data.order_numbers,
      }, { headers: authHeader })

        ; window.snap?.pay(payment.midtrans_token, {
          onSuccess: () => {
            onPaymentSuccess?.()   // ← set flag dulu
            router.push(`/checkout/success?orders=${data.order_numbers.join(',')}`)
          },
          onPending: () => {
            onPaymentSuccess?.()
            router.push(`/checkout/success?orders=${data.order_numbers.join(',')}`)
          },
          onError: () => toast.error('Pembayaran gagal. Coba lagi.'),
          onClose: () => toast.info('Pembayaran dibatalkan.'),
        })
    } catch (error: unknown) {
      const issues = stockIssuesFrom(error)
      if (issues && issues.length > 0) {
        setStockIssues(issues)
      } else {
        toast.error(apiErrorMessage(error, 'Terjadi kesalahan.'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleNextStep1() {
    if (!name) { toast.error('Isi nama penerima'); return }

    // ✅ Kalau member login → simpan name & email ke DB
    if (member && token) {
      try {
        const { data } = await api.put('/member/profile',
          { name, email: email || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        // Update local store dengan data dari DB
        useMemberStore.getState().setMember(data, token)
      } catch {
        toast.error('Gagal menyimpan profil')
        return
      }
    }

    setStep(2)
  }

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: S.gray, fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Kembali ke Menu
      </button>

      <h1 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 'clamp(32px,5vw,42px)', fontWeight: 700, color: S.navy, marginBottom: 8 }}>
        Checkout
      </h1>

      {branchCount > 1 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(27,58,107,0.06)', border: '1px solid rgba(27,58,107,0.1)', borderRadius: 8, padding: '6px 12px', marginBottom: 20, fontSize: 12, color: S.navy }}>
          🏪 {branchCount} cabang · dikirim terpisah · 1 pembayaran
        </div>
      )}

      <StepBar step={step} />

      <div style={{ display: 'flex', gap: 24, alignItems: 'start', flexWrap: 'wrap' }}>

        {/* ── Form ── */}
        <div style={{ flex: 1, minWidth: 300 }}>

          {/* Step 1 */}
          {step === 1 && (
            <div className="checkout-card" style={{ background: '#fff', borderRadius: 16, padding: 26, border: `1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 26, color: S.navy, marginBottom: 6 }}>Verifikasi WhatsApp</h2>
              <p style={{ fontSize: 12, color: S.gray, marginBottom: 20 }}>Verifikasi nomor HP untuk melanjutkan checkout</p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Nomor WhatsApp *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: S.gray }}>+62</span>
                    <input className="c-input" style={{ paddingLeft: 44 }} placeholder="8xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/^0/, ''))} disabled={!!member} />
                  </div>
                  {!member && (
                    <button onClick={() => {
                      if (!name.trim()) {
                        toast.error('Isi nama penerima terlebih dahulu.')
                        return
                      }
                      setShowOTP(true)
                    }} className="c-btn c-btn-primary c-btn-sm" style={{ flexShrink: 0 }}>
                      Kirim OTP
                    </button>
                  )}
                </div>
                {member
                  ? <p style={{ fontSize: 11, color: S.green, marginTop: 4 }}>✓ Terverifikasi sebagai member</p>
                  : <p style={{ fontSize: 11, color: S.gray, marginTop: 4 }}>Verifikasi WhatsApp wajib dilakukan sebelum lanjut ke tahap alamat</p>
                }
              </div>

              <div className="checkout-contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Nama Penerima *</label>
                  <input className="c-input" placeholder="Nama lengkap" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Email (opsional)</label>
                  <input className="c-input" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div style={{ background: S.grayL, borderRadius: 10, padding: 12, marginBottom: 16, display: 'flex', gap: 8 }}>
                <span>💡</span>
                <p style={{ fontSize: 11, color: S.gray, lineHeight: 1.6 }}>
                  Promo yang sedang aktif akan dihitung otomatis setelah kamu memilih pengiriman.
                </p>
              </div>

              <button
                onClick={handleNextStep1}
                disabled={!name || !member}
                className="c-btn c-btn-primary c-btn-lg c-btn-full">
                Lanjut ke Alamat →
              </button>
              {!member && (
                <p style={{ fontSize: 11, color: S.gray, marginTop: 8, textAlign: 'center' }}>
                  Klik &quot;Kirim OTP&quot; dan masukkan kode verifikasi untuk mengaktifkan tombol ini.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
              <div className="checkout-card" style={{ background:'#fff', borderRadius:16, padding:26, border:`1px solid ${S.creamDp}` }}>
                <h2 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:26, color:S.navy, marginBottom:6 }}>
                  Pengiriman
                </h2>
                <p style={{ fontSize:12, color:S.gray, marginBottom:20 }}>
                  Pilih cara menerima pesananmu
                </p>

                {/* ✅ Toggle Delivery/Pickup */}
                <FulfillmentToggle value={fulfillmentType} onChange={setFulfillmentType} />

                {fulfillmentType === 'delivery' ? (
                  <>
                    {/* Existing AddressForm */}
                    <AddressForm onSelect={setAddress} member={member} />

                    {/* Existing ShippingOptions per branch */}
                    {grouped.map(g => (
                      <div key={g.branchId} style={{ marginBottom:16 }}>
                        <p style={{ fontSize:13, fontWeight:600, color:S.dark, marginBottom:8 }}>
                          📦 {g.branchName}
                        </p>
                        <ShippingOptions
                          address={address}
                          branchId={g.branchId}
                          items={g.items}
                          onSelect={rate => setShippings(prev => ({ ...prev, [g.branchId]: rate }))}
                        />
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* ✅ Pickup — per branch */}
                    {grouped.map(g => {
                      const branch = branches.find(b => b.id === g.branchId)
                      if (!branch) return null

                      return (
                        <div key={g.branchId} style={{ marginBottom:20 }}>
                          <p style={{ fontSize:13, fontWeight:600, color:S.dark, marginBottom:8 }}>
                            🏃 Ambil di {g.branchName}
                          </p>
                          <PickupScheduler
                            branch={branch}
                            onSelect={(datetime, note) => setPickupSchedule({ datetime, note })}
                          />
                        </div>
                      )
                    })}

                    {/* Info gratis ongkir */}
                    <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10, padding:12, fontSize:12, color:S.green, marginTop:8 }}>
                      ✓ Gratis biaya pengiriman untuk pickup
                    </div>
                  </>
                )}

                <button
                  onClick={() => setStep(3)}
                  disabled={
                    fulfillmentType === 'delivery'
                      ? (!address || Object.keys(shippings).length < grouped.length)
                      : !pickupSchedule
                  }
                  className="c-btn c-btn-primary c-btn-lg c-btn-full"
                  style={{ marginTop:20 }}>
                  Lanjut ke Pembayaran →
                </button>
              </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="checkout-card" style={{ background: '#fff', borderRadius: 16, padding: 26, border: `1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: 26, color: S.navy, marginBottom: 6 }}>Pembayaran</h2>
              <p style={{ fontSize: 12, color: S.gray, marginBottom: 20 }}>1 transaksi untuk semua cabang</p>

              {stockIssues && stockIssues.length > 0 && (
                <div style={{ background: 'rgba(196,30,58,0.06)', border: `1px solid ${S.red}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: S.red, marginBottom: 6 }}>
                        Beberapa produk tidak bisa diproses
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {stockIssues.map((issue, i) => (
                          <li key={i} style={{ fontSize: 12, color: S.dark, lineHeight: 1.5 }}>{issue}</li>
                        ))}
                      </ul>
                      <p style={{ fontSize: 11, color: S.gray, marginTop: 8 }}>
                        Hapus atau ganti produk tersebut dari keranjang, lalu coba lagi.
                      </p>
                      <button
                        onClick={() => router.push('/menu')}
                        className="c-btn c-btn-primary c-btn-sm"
                        style={{ marginTop: 10 }}>
                        Kembali ke Menu
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <VoucherInput
                preview={activePromoPreview}
                promoCode={promoCode}
                loading={promoLoading}
                onApplyCode={applyPromo}
                onRemoveCode={() => setPromoCode(null)}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, marginBottom: 20, background: 'rgba(27,58,107,0.05)', border: '1px solid rgba(27,58,107,0.12)', borderRadius: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: S.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>💳</div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: S.navy }}>Pembayaran aman melalui Midtrans</p>
                  <p style={{ fontSize: 11, color: S.gray, lineHeight: 1.5, marginTop: 2 }}>Pilih transfer bank, virtual account, QRIS, atau metode lain yang tersedia langsung di halaman pembayaran Midtrans.</p>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Catatan (opsional)</label>
                <textarea className="c-input" style={{ resize: 'none', height: 76 }} placeholder="Catatan untuk semua cabang..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {branchCount > 1 && (
                <div style={{ background: 'rgba(27,58,107,0.05)', border: '1px solid rgba(27,58,107,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: S.navy }}>
                  ℹ️ Kamu akan membuat <strong>{branchCount} pesanan terpisah</strong> dengan 1 kali pembayaran. Setiap cabang mengirimkan paketnya sendiri.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button onClick={() => setStep(2)} className="c-btn c-btn-ghost c-btn-md" style={{ flex: 1 }}>← Kembali</button>
                <button onClick={placeOrder} disabled={loading || promoLoading || !activePromoPreview} className="c-btn c-btn-navy c-btn-md" style={{ flex: 2 }}>
                  {loading ? '⏳ Memproses...' : `💳 Bayar ${formatRupiah(grandTotal)}`}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                {['🔒 SSL', 'Midtrans', 'PCI DSS'].map(t => (
                  <span key={t} style={{ fontSize:11, color: S.gray, background: S.grayL, padding: '3px 8px', borderRadius: 4 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <Sidebar grouped={grouped} shippings={shippings} preview={activePromoPreview} fulfillmentType={fulfillmentType} />
      </div>

      {showOTP && (
        <OTPModal open={showOTP} phone={'0' + phone} name={name} email={email} onClose={() => setShowOTP(false)} onVerified={() => { setShowOTP(false); setStep(2) }} />
      )}
    </div>
  )
}
