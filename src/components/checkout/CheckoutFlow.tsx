'use client'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import {
  groupCartByBranch,
  getPreparationMethods,
  useCartItems,
  useCartStore,
  type BranchGroup,
  type CartItem,
} from '@/stores/cart.store'
import { useAffiliateStore } from '@/stores/affiliate.store'
import { useMemberStore } from '@/stores/member.store'
import type { AffiliateValidateResponse, Branch, PromotionPreview } from '@/types'
import axios from 'axios'
import { Check, CreditCard, MapPin, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import AddressForm, { type AddressPayload } from './AddressForm'
import AffiliateCodeInput from './AffiliateCodeInput'
import BranchShippingCard, { type BranchShippingState } from './BranchShippingCard'
import OTPModal from './OTPModal'
import VoucherInput from './VoucherInput'

interface Props { onPaymentSuccess?: () => void }

const S = {
  red:'#C41E3A', navy:'#1B3A6B', gold:'#E8A020',
  creamDp:'#EDD9B8', creamD:'#F5EDD9',
  gray:'#6B7280', grayL:'#F3F0EB', grayM:'#E5E2DC',
  dark:'#1A1A2E', green:'#10B981',
}

interface ApiErrorData { message?: string; errors?: Record<string, string[]> }
interface StockIssue { message: string; branchIndex?: number; itemIndex?: number }

function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiErrorData>(error)) return fallback
  return error.response?.data?.errors?.promo_code?.[0]
    ?? error.response?.data?.errors?.items?.join(' ')
    ?? Object.values(error.response?.data?.errors ?? {}).flat()[0]
    ?? error.response?.data?.message
    ?? fallback
}

function stockIssuesFrom(error: unknown): StockIssue[] | null {
  if (!axios.isAxiosError<ApiErrorData>(error)) return null
  const errors = error.response?.data?.errors
  if (!errors) return null

  const issues = Object.entries(errors).flatMap(([key, messages]) => {
    const match = key.match(/^branches\.(\d+)\.items\.(\d+)$/)
    if (!match && key !== 'items') return []
    return messages.map(message => ({
      message,
      branchIndex: match ? Number(match[1]) : undefined,
      itemIndex: match ? Number(match[2]) : undefined,
    }))
  })

  return issues.length > 0 ? issues : null
}

// ── Item key helper ───────────────────────────────────────
const itemKey = (i: CartItem) => `${i.id}:${i.branchId}`

// ─── Step Indicator ───────────────────────────────────────
const STEPS = [
  { label:'Verifikasi', sub:'OTP WhatsApp', Icon:Smartphone },
  { label:'Alamat', sub:'Lokasi Pengiriman', Icon:MapPin },
  { label:'Pembayaran', sub:'Metode Bayar', Icon:CreditCard },
]

function StepBar({ step }: { step: number }) {
  return (
    <nav className="checkout-stepper" aria-label="Progres checkout">
      <ol>
        {STEPS.map(({ label, sub, Icon }, index) => {
          const stepNumber = index + 1
          const state = stepNumber < step ? 'complete' : stepNumber === step ? 'active' : 'upcoming'

          return (
            <li key={label} className={`checkout-step checkout-step--${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              <div className="checkout-step__content">
                <span className="checkout-step__icon" aria-hidden="true">
                  {state === 'complete' ? <Check size={21} strokeWidth={2.5} /> : <Icon size={20} strokeWidth={2} />}
                </span>
                <span className="checkout-step__copy">
                  <span className="checkout-step__label">{label}</span>
                  <span className="checkout-step__sub">{sub}</span>
                </span>
              </div>
              {index < STEPS.length - 1 && <span className="checkout-step__connector" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── Item Selection (Parsial Checkout) ────────────────────
function ItemSelector({ allItems, selectedKeys, onToggle, onToggleAll }: {
  allItems: CartItem[]
  selectedKeys: Set<string>
  onToggle: (key: string) => void
  onToggleAll: (branchId: string, select: boolean) => void
}) {
  const byBranch = useMemo(() => groupCartByBranch(allItems), [allItems])
  if (byBranch.length === 0) return null

  return (
    <div style={{ background:'#fff', borderRadius:16, padding:20, border:`1px solid ${S.creamDp}`, marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <p style={{ fontSize:14, fontWeight:700, color:S.dark }}>Pilih item yang ingin dibayar</p>
          <p style={{ fontSize:11, color:S.gray, marginTop:2 }}>
            {selectedKeys.size} dari {allItems.length} item dipilih
          </p>
        </div>
        <button
          onClick={() => {
            const allSelected = allItems.every(i => selectedKeys.has(itemKey(i)))
            allItems.forEach(i => onToggle(itemKey(i)))
            // kalau semua terpilih → unselect semua; kalau tidak → select semua
            if (!allSelected) {
              allItems.forEach(i => { if (!selectedKeys.has(itemKey(i))) onToggle(itemKey(i)) })
            }
          }}
          style={{ fontSize:11, color:S.navy, background:'none', border:`1px solid ${S.creamDp}`, borderRadius:8, padding:'4px 10px', cursor:'pointer' }}>
          {allItems.every(i => selectedKeys.has(itemKey(i))) ? 'Batal Semua' : 'Pilih Semua'}
        </button>
      </div>

      {byBranch.map(group => {
        const allBranchSelected = group.items.every(i => selectedKeys.has(itemKey(i)))
        const someBranchSelected = group.items.some(i => selectedKeys.has(itemKey(i)))

        return (
          <div key={group.branchId} style={{ marginBottom:12 }}>
            {/* Branch header + select all branch */}
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:`1px solid ${S.grayL}`, marginBottom:6 }}>
              <input
                type="checkbox"
                checked={allBranchSelected}
                ref={el => { if (el) el.indeterminate = someBranchSelected && !allBranchSelected }}
                onChange={e => onToggleAll(group.branchId, e.target.checked)}
                style={{ width:15, height:15, accentColor:S.navy, cursor:'pointer' }}
              />
              <p style={{ fontSize:11, fontWeight:700, color:S.navy }}>📍 {group.branchName}</p>
              <span style={{ fontSize:10, color:S.gray, marginLeft:'auto' }}>
                {formatRupiah(group.items.filter(i => selectedKeys.has(itemKey(i))).reduce((s,i) => s+i.price*i.qty, 0))}
              </span>
            </div>

            {/* Items */}
            {group.items.map(item => {
              const key     = itemKey(item)
              const checked = selectedKeys.has(key)
              return (
                <label key={key}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 4px', cursor:'pointer', borderRadius:8, transition:'background 0.15s',
                    background: checked ? 'rgba(27,58,107,0.03)' : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(key)}
                    style={{ width:15, height:15, accentColor:S.red, cursor:'pointer', flexShrink:0 }}
                  />
                  <div style={{ width:30, height:30, background:S.creamD, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>🍜</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:12, fontWeight:500, color: checked ? S.dark : S.gray, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize:10, color:S.gray }}>{item.qty} × {formatRupiah(item.price)}</p>
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, color: checked ? S.dark : S.gray, flexShrink:0 }}>
                    {formatRupiah(item.price * item.qty)}
                  </span>
                </label>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────
function Sidebar({ grouped, branchStates, preview }: {
  grouped: BranchGroup[]
  branchStates: Record<string, BranchShippingState>
  preview: PromotionPreview | null
}) {
  const totalItems     = grouped.reduce((s, g) => s + g.subtotal, 0)
  const totalShipping  = grouped.reduce((s, g) => {
    const bs = branchStates[g.branchId]
    if (!bs || bs.fulfillment==='pickup') return s
    return s + (bs.rate?.price ?? 0)
  }, 0)
  const totalInsurance = grouped.reduce((s, g) => {
    const bs = branchStates[g.branchId]
    if (!bs || bs.fulfillment==='pickup') return s
    return s + (bs.rate?.insurance_fee ?? 0)
  }, 0)
  const productDiscount  = preview?.product_discount  ?? 0
  const shippingDiscount = preview?.shipping_discount ?? 0
  const grand = preview?.grand_total ?? (totalItems + totalShipping + totalInsurance)

  return (
    <div className="checkout-summary" style={{ width:'100%', maxWidth:290, background:'#fff', borderRadius:16, padding:20, border:`1px solid ${S.creamDp}`, position:'sticky', top:80, alignSelf:'start', flexShrink:0 }}>
      <h3 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:18, color:S.navy, marginBottom:14 }}>
        Ringkasan
      </h3>

      {grouped.length === 0 && (
        <p style={{ fontSize:12, color:S.gray, textAlign:'center', padding:'12px 0' }}>
          Pilih item yang ingin dibayar
        </p>
      )}

      {grouped.map(({ branchId, branchName, items }) => {
        const bs       = branchStates[branchId]
        const isPickup = bs?.fulfillment === 'pickup'
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
        const shipping  = !isPickup ? (bs?.rate?.price ?? 0) : 0
        const insurance = !isPickup ? (bs?.rate?.insurance_fee ?? 0) : 0
        const branchTotal = subtotal + shipping + insurance

        return (
          <div key={branchId} style={{ marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${S.grayL}` }}>
            {/* Branch header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <p style={{ fontSize:11, fontWeight:700, color:S.navy }}>📍 {branchName}</p>
              <span style={{
                fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:10,
                background: isPickup ? 'rgba(16,185,129,0.1)' : 'rgba(27,58,107,0.08)',
                color: isPickup ? S.green : S.navy,
              }}>
                {isPickup ? '🏃 Pickup' : '🚚 Delivery'}
              </span>
            </div>

            {/* Items */}
            {items.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <div style={{ width:28, height:28, background:S.creamD, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>🍜</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:11, fontWeight:500, color:S.dark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.name} × {item.qty}
                  </p>
                  {bs?.preparations?.[item.id] && (
                    <p style={{ fontSize:9, color:S.green, textTransform:'capitalize' }}>
                      {bs.preparations[item.id] === 'kukus' ? 'Dikukus' : bs.preparations[item.id] === 'goreng' ? 'Digoreng' : 'Frozen'}
                    </p>
                  )}
                </div>
                <span style={{ fontSize:11, fontWeight:600, flexShrink:0 }}>{formatRupiah(item.price*item.qty)}</span>
              </div>
            ))}

            {/* Ongkir breakdown */}
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px dashed ${S.grayL}` }}>
              {isPickup ? (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.green }}>
                  <span>Pickup · gratis</span>
                  <span>{bs?.pickup ? new Date(bs.pickup.datetime).toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short'}) : '—'}</span>
                </div>
              ) : bs?.rate ? (
                <>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.gray, marginBottom:2 }}>
                    <span>{bs.rate.courier_name} {bs.rate.service_name}</span>
                    <span>{formatRupiah(bs.rate.price)}</span>
                  </div>
                  {bs.rate.insurance_fee > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.gray, marginBottom:2 }}>
                      <span>🛡️ Asuransi</span>
                      <span>{formatRupiah(bs.rate.insurance_fee)}</span>
                    </div>
                  )}
                  {bs.rate.is_instant && (
                    <div style={{ fontSize:10, color:S.gold }}>
                      {bs.rate.free_cooking ? '⚡🍳 Instant + Gratis Masak' : '⚡❄️ Instant · Frozen'}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize:11, color:S.gold }}>Pilih kurir...</div>
              )}
            </div>

            {/* Branch subtotal */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:6, borderTop:`1px solid ${S.grayL}`, fontSize:12, fontWeight:600, color:S.dark }}>
              <span>Subtotal cabang</span>
              <span>{formatRupiah(branchTotal)}</span>
            </div>
          </div>
        )
      })}

      {/* Grand total breakdown */}
      {grouped.length > 0 && (
        <div style={{ paddingTop:4 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:4 }}>
            <span>Produk</span><span>{formatRupiah(totalItems)}</span>
          </div>
          {totalShipping > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:4 }}>
              <span>Ongkir</span><span>{formatRupiah(totalShipping)}</span>
            </div>
          )}
          {totalInsurance > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:S.gray, marginBottom:4 }}>
              <span>🛡️ Asuransi</span><span>{formatRupiah(totalInsurance)}</span>
            </div>
          )}
          {productDiscount > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.green, marginBottom:4 }}>
              <span>Diskon</span><span>− {formatRupiah(productDiscount)}</span>
            </div>
          )}
          {shippingDiscount > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:S.green, marginBottom:4 }}>
              <span>Diskon Ongkir</span><span>− {formatRupiah(shippingDiscount)}</span>
            </div>
          )}
          {preview?.applied_promotions.map(promo => (
            <div key={promo.id} style={{ fontSize:11, color:S.green, marginBottom:3 }}>✓ {promo.name}</div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:`1px solid ${S.creamDp}` }}>
            <span style={{ fontWeight:600, fontSize:13 }}>Total Bayar</span>
            <span style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:20, fontWeight:700, color:S.red }}>
              {formatRupiah(grand)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export default function CheckoutFlow({ onPaymentSuccess }: Props) {
  const router = useRouter()

  const allItems    = useCartItems()
  const removeItem  = useCartStore(s => s.removeItem)

  const { member, token } = useMemberStore()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  // ── Item selection (parsial checkout) ──────────────────
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(allItems.map(itemKey))
  )

  const allItemsKey = allItems.map(itemKey).join('|')

  // Sync when new items added to cart
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedKeys(prev => {
      const next = new Set(prev)
      allItems.forEach(i => { if (!next.has(itemKey(i))) next.add(itemKey(i)) })
      return next
    })
  }, [allItems, allItemsKey])

  function toggleItem(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleBranch(branchId: string, select: boolean) {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      allItems.filter(i => i.branchId === branchId).forEach(i => {
        if (select) next.add(itemKey(i))
        else next.delete(itemKey(i))
      })
      return next
    })
  }

  // Only selected items go to checkout
  const selectedItems = useMemo(
    () => allItems.filter(i => selectedKeys.has(itemKey(i))),
    [allItems, selectedKeys]
  )
  const grouped = useMemo(() => groupCartByBranch(selectedItems), [selectedItems])
  const selectedBranchCount = new Set(selectedItems.map(i => i.branchId)).size

  // ── Steps ───────────────────────────────────────────────
  const [step,    setStep]    = useState(1)
  const [phone,   setPhone]   = useState(member?.phone?.replace(/^(62|0)/,'') ?? '')
  const [name,    setName]    = useState(member?.name ?? '')
  const [email,   setEmail]   = useState('')
  const [showOTP, setShowOTP] = useState(false)

  const [address,      setAddress]      = useState<AddressPayload | null>(null)
  const [branches,     setBranches]     = useState<Branch[]>([])
  const [branchStates, setBranchStates] = useState<Record<string, BranchShippingState>>({})

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBranchStates(prev => {
      const next = { ...prev }
      grouped.forEach(g => {
        if (!next[g.branchId]) next[g.branchId] = { fulfillment:'delivery', rate:null, pickup:null, preparations:{} }
      })
      // Remove branches no longer in grouped
      Object.keys(next).forEach(id => {
        if (!grouped.find(g => g.branchId === id)) delete next[id]
      })
      return next
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped.map(g => g.branchId).join(',')])

  const [promoCode,     setPromoCode]     = useState<string | null>(null)
  const [promoResult,   setPromoResult]   = useState<{ key:string; preview:PromotionPreview } | null>(null)
  const [applyingPromo, setApplyingPromo] = useState(false)
  const [notes,         setNotes]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [stockIssues,   setStockIssues]   = useState<StockIssue[] | null>(null)

  const [affiliateCode,     setAffiliateCode]     = useState<string | null>(null)
  const [affiliateName,     setAffiliateName]     = useState<string | null>(null)
  const [applyingAffiliate, setApplyingAffiliate] = useState(false)

  // ── Computed ─────────────────────────────────────────────
  const needsAddress = Object.values(branchStates).some(s => s.fulfillment === 'delivery')

  const allBranchReady = grouped.length > 0 && grouped.every(g => {
    const s = branchStates[g.branchId]
    const branch = branches.find(candidate => candidate.id === g.branchId)
    if (branch?.operational_status && !branch.operational_status.accepting_orders) return false
    if (!s) return false
    if (s.fulfillment === 'pickup') {
      return !!s.pickup && g.items.every(item => getPreparationMethods(item).includes('frozen'))
    }
    if (!s.rate) return false

    const requiresPreparation = s.rate.is_instant
      && !!branch?.can_cook
      && !branch.sells_frozen_only

    return !requiresPreparation || g.items.every(item => {
      const method = s.preparations?.[item.id]
      return !!method && getPreparationMethods(item).includes(method)
    })
  })

  const calculatedTotal = grouped.reduce((sum, g) => {
    const s = branchStates[g.branchId]
    if (!s || s.fulfillment === 'pickup') return sum + g.subtotal
    return sum + g.subtotal + (s.rate?.price ?? 0) + (s.rate?.insurance_fee ?? 0)
  }, 0)

  const pricingReady = grouped.length > 0 && allBranchReady

  const promoBranches = useMemo(() => grouped.map(g => {
    const s = branchStates[g.branchId]
    const isPickup = s?.fulfillment === 'pickup'
    return {
      branch_id: g.branchId,
      items: g.items.map(item => ({ product_id: item.id, quantity: item.qty })),
      shipping: !isPickup && s?.rate ? {
        cost: s.rate.price, insurance_fee: s.rate.insurance_fee ?? 0, is_instant: s.rate.is_instant ?? false,
      } : { cost:0, insurance_fee:0, is_instant:false },
    }
  }), [branchStates, grouped])

  const promoInputKey    = useMemo(() => JSON.stringify({ promoCode, affiliateCode, branches: promoBranches }), [promoBranches, promoCode, affiliateCode])
  const activePromoPreview = pricingReady && promoResult?.key === promoInputKey ? promoResult.preview : null
  const promoLoading     = applyingPromo || (pricingReady && !activePromoPreview)
  const grandTotal       = activePromoPreview?.grand_total ?? calculatedTotal

  // ── Effects ──────────────────────────────────────────────
  useEffect(() => {
    api.get('/branches').then(({ data }) => setBranches(Array.isArray(data) ? data : []))
  }, [])

  const requestPromoPreview = useCallback(async (code: string | null) => {
    const { data } = await api.post<PromotionPreview>('/promotions/preview', {
      promo_code: code, affiliate_code: affiliateCode, phone: phone ? '0'+phone : null, branches: promoBranches,
    }, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    return data
  }, [promoBranches, token, affiliateCode, phone])

  useEffect(() => {
    if (!pricingReady) return
    let cancelled = false
    requestPromoPreview(promoCode)
      .then(data => {
        if (cancelled) return
        setPromoResult({ key: promoInputKey, preview: data })
        setStockIssues(null)
      })
      .catch(error => {
        if (cancelled) return
        setPromoResult(null)
        const issues = stockIssuesFrom(error)
        if (issues?.length) {
          // Item di keranjang sudah tidak tersedia/stok kurang di cabang tsb.
          // Tampilkan pesannya — jangan biarkan tombol Bayar diam tanpa alasan.
          setStockIssues(issues)
          return
        }
        if (promoCode) { toast.error(apiErrorMessage(error,'Promo tidak lagi memenuhi syarat.')); setPromoCode(null) }
      })
    return () => { cancelled = true }
  }, [pricingReady, promoCode, promoInputKey, requestPromoPreview])

  // ── Handlers ─────────────────────────────────────────────
  async function applyPromo(code: string) {
    if (!pricingReady) { toast.error('Pilih pengiriman terlebih dahulu.'); return false }
    setApplyingPromo(true)
    try {
      const preview = await requestPromoPreview(code)
      setPromoResult({ key: JSON.stringify({ promoCode:code, affiliateCode, branches:promoBranches }), preview })
      setPromoCode(code)
      toast.success(`Promo ${code} berhasil diterapkan.`)
      return true
    } catch (error) {
      toast.error(apiErrorMessage(error,'Kode promo tidak valid.'))
      return false
    } finally { setApplyingPromo(false) }
  }

  const requestAffiliateValidate = useCallback(async (code: string) => {
    const { data } = await api.post<AffiliateValidateResponse>('/affiliates/validate', { code, phone: '0'+phone })
    return data
  }, [phone])

  async function applyAffiliateCode(code: string) {
    if (!phone) { toast.error('Isi nomor HP terlebih dahulu.'); return false }
    setApplyingAffiliate(true)
    try {
      const data = await requestAffiliateValidate(code)
      if (data.valid) {
        setAffiliateCode(code)
        setAffiliateName(data.affiliate_name ?? null)
        useAffiliateStore.getState().setCode(code)
        toast.success(`Kode affiliate ${code} diterapkan.`)
        return true
      }
      toast.error(data.message ?? 'Kode affiliate tidak valid.')
      return false
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Kode affiliate tidak valid.'))
      return false
    } finally { setApplyingAffiliate(false) }
  }

  function removeAffiliateCode() {
    setAffiliateCode(null)
    setAffiliateName(null)
    useAffiliateStore.getState().clearCode()
  }

  useEffect(() => {
    if (step !== 3 || affiliateCode || !phone) return
    const stored = useAffiliateStore.getState().code
    if (!stored) return
    let cancelled = false
    requestAffiliateValidate(stored)
      .then(data => {
        if (cancelled || !data.valid) return
        setAffiliateCode(stored)
        setAffiliateName(data.affiliate_name ?? null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [step, phone, affiliateCode, requestAffiliateValidate])

  async function handleNextStep1() {
    if (!name) { toast.error('Isi nama penerima'); return }
    if (selectedItems.length === 0) { toast.error('Pilih setidaknya 1 item'); return }
    if (member && token) {
      try {
        const { data } = await api.put('/member/profile',
          { name, email: email||undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        useMemberStore.getState().setMember(data, token)
      } catch { toast.error('Gagal menyimpan profil'); return }
    }
    setStep(2)
  }

  async function placeOrder() {
    if (needsAddress && !address) { toast.error('Pilih alamat pengiriman'); return }
    if (!allBranchReady) { toast.error('Lengkapi metode pengiriman semua cabang'); return }
    setLoading(true)
    setStockIssues(null)
    try {
      const { data } = await api.post('/orders', {
        phone: '0'+phone, name, email, notes, promo_code: promoCode, affiliate_code: affiliateCode,
        address: needsAddress && address ? {
          address: address.address, detail: address.detail,
          province_name: address.province_name, regency_name: address.regency_name,
          district_name: address.district_name, village_name: address.village_name,
          postal_code: address.postal_code, latitude: address.latitude, longitude: address.longitude,
        } : null,
        branches: grouped.map(g => {
          const s = branchStates[g.branchId]
          const isPickup = s?.fulfillment === 'pickup'
          return {
            branch_id: g.branchId,
            fulfillment_type: s?.fulfillment ?? 'delivery',
            pickup_scheduled_at: isPickup ? (s?.pickup?.datetime ?? null) : null,
            pickup_note: isPickup ? (s?.pickup?.note ?? null) : null,
            items: g.items.map(i => ({
              product_id:i.id,
              quantity:i.qty,
              price:i.price,
              preparation_method: !isPickup && s?.rate?.is_instant
                ? (s.preparations?.[i.id] ?? null)
                : null,
            })),
            shipping: isPickup
              ? { courier:'pickup', service:'self', cost:0, insurance_fee:0, is_instant:false, free_cooking:false }
              : { courier:s?.rate?.courier??'', service:s?.rate?.service??'', cost:s?.rate?.price??0,
                  insurance_fee:s?.rate?.insurance_fee??0, is_instant:s?.rate?.is_instant??false, free_cooking:s?.rate?.free_cooking??false },
          }
        }),
      }, { headers: authHeader })

      const { data: payment } = await api.post('/orders/payment/initiate', {
        order_numbers: data.order_numbers,
      }, { headers: authHeader })

      window.snap?.pay(payment.midtrans_token, {
        onSuccess: () => {
          onPaymentSuccess?.()
          // ✅ Hanya hapus item yang dipilih (bukan clearCart)
          selectedItems.forEach(i => removeItem(i.id, i.branchId))
          router.push(`/checkout/success?orders=${data.order_numbers.join(',')}`)
        },
        onPending: () => {
          onPaymentSuccess?.()
          selectedItems.forEach(i => removeItem(i.id, i.branchId))
          router.push(`/checkout/success?orders=${data.order_numbers.join(',')}`)
        },
        onError:   () => toast.error('Pembayaran gagal. Coba lagi.'),
        onClose:   () => toast.info('Pembayaran dibatalkan.'),
      })
    } catch (error: unknown) {
      const issues = stockIssuesFrom(error)
      if (issues?.length) setStockIssues(issues)
      else toast.error(apiErrorMessage(error,'Terjadi kesalahan.'))
    } finally { setLoading(false) }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="c-app" style={{ paddingTop:44, paddingBottom:60 }}>
      <button onClick={() => router.back()} style={{ background:'none', border:'none', color:S.gray, fontSize:13, cursor:'pointer', marginBottom:20, padding:0 }}>
        ← Kembali ke Menu
      </button>

      <h1 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:'clamp(32px,5vw,42px)', fontWeight:700, color:S.navy, marginBottom:8 }}>
        Checkout
      </h1>

      {selectedBranchCount > 1 && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(27,58,107,0.06)', border:'1px solid rgba(27,58,107,0.1)', borderRadius:8, padding:'6px 12px', marginBottom:16, fontSize:12, color:S.navy }}>
          🏪 {selectedBranchCount} cabang · dikirim terpisah · 1 pembayaran
        </div>
      )}

      {/* ── Pilihan item (selalu tampil) ── */}
      <ItemSelector
        allItems={allItems}
        selectedKeys={selectedKeys}
        onToggle={toggleItem}
        onToggleAll={toggleBranch}
      />

      <StepBar step={step} />

      <div style={{ display:'flex', gap:24, alignItems:'start', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:300 }}>

          {/* Step 1 */}
          {step === 1 && (
            <div className="checkout-card" style={{ background:'#fff', borderRadius:16, padding:26, border:`1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:26, color:S.navy, marginBottom:6 }}>
                Verifikasi WhatsApp
              </h2>
              <p style={{ fontSize:12, color:S.gray, marginBottom:20 }}>Verifikasi nomor HP untuk melanjutkan checkout</p>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>Nomor WhatsApp *</label>
                <div style={{ display:'flex', gap:8 }}>
                  <div style={{ position:'relative', flex:1 }}>
                    <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:13, color:S.gray }}>+62</span>
                    <input className="c-input" style={{ paddingLeft:44 }} placeholder="8xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/^0/,''))} disabled={!!member} />
                  </div>
                  {!member && (
                    <button onClick={() => { if (!name.trim()) { toast.error('Isi nama penerima terlebih dahulu.'); return } setShowOTP(true) }}
                      className="c-btn c-btn-primary c-btn-sm" style={{ flexShrink:0 }}>
                      Kirim OTP
                    </button>
                  )}
                </div>
                {member
                  ? <p style={{ fontSize:11, color:S.green, marginTop:4 }}>✓ Terverifikasi sebagai member</p>
                  : <p style={{ fontSize:11, color:S.gray, marginTop:4 }}>Kode OTP akan dikirim via WhatsApp</p>
                }
              </div>

              <div className="checkout-contact-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div>
                  <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>Nama Penerima *</label>
                  <input className="c-input" placeholder="Nama lengkap" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>Email (opsional)</label>
                  <input className="c-input" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div style={{ background:S.grayL, borderRadius:10, padding:12, marginBottom:16, display:'flex', gap:8 }}>
                <span>💡</span>
                <p style={{ fontSize:11, color:S.gray, lineHeight:1.6 }}>Promo aktif akan dihitung otomatis setelah memilih pengiriman.</p>
              </div>

              <button onClick={handleNextStep1} disabled={!name || (!member && !phone) || selectedItems.length === 0}
                className="c-btn c-btn-primary c-btn-lg c-btn-full">
                Lanjut ke Pengiriman →
              </button>
              {selectedItems.length === 0 && (
                <p style={{ fontSize:11, color:S.red, marginTop:8, textAlign:'center' }}>
                  Pilih minimal 1 item di atas
                </p>
              )}
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="checkout-card" style={{ background:'#fff', borderRadius:16, padding:26, border:`1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:26, color:S.navy, marginBottom:6 }}>Pengiriman</h2>
              <p style={{ fontSize:12, color:S.gray, marginBottom:20 }}>Pilih metode pengiriman untuk setiap cabang</p>

              {needsAddress && (
                <div style={{ marginBottom:20 }}>
                  <p style={{ fontSize:12, fontWeight:600, color:S.dark, marginBottom:10 }}>📍 Alamat Pengiriman</p>
                  <AddressForm onSelect={setAddress} member={member} />
                </div>
              )}

              {grouped.map((g, i) => {
                const branch = branches.find(b => b.id === g.branchId)
                if (!branch) return null
                const state = branchStates[g.branchId] ?? { fulfillment:'delivery', rate:null, pickup:null, preparations:{} }
                return (
                  <BranchShippingCard
                    key={g.branchId}
                    branch={branch}
                    items={g.items}
                    address={state.fulfillment === 'delivery' ? address : null}
                    state={state}
                    onChange={newState => setBranchStates(prev => ({ ...prev, [g.branchId]: newState }))}
                    index={i}
                  />
                )
              })}

              <button onClick={() => setStep(3)} disabled={!allBranchReady || (needsAddress && !address)}
                className="c-btn c-btn-primary c-btn-lg c-btn-full" style={{ marginTop:8 }}>
                Lanjut ke Pembayaran →
              </button>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="checkout-card" style={{ background:'#fff', borderRadius:16, padding:26, border:`1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily:"var(--font-display), Georgia, serif", fontSize:26, color:S.navy, marginBottom:6 }}>Pembayaran</h2>
              <p style={{ fontSize:12, color:S.gray, marginBottom:20 }}>1 transaksi untuk semua cabang yang dipilih</p>

              {stockIssues && stockIssues.length > 0 && (
                <div style={{ background:'rgba(232,160,32,0.08)', border:'1px solid rgba(232,160,32,.38)', borderRadius:12, padding:16, marginBottom:20 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                    <span style={{ fontSize:18, flexShrink:0 }}>🛒</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#92600A', marginBottom:3 }}>Perbarui keranjang untuk melanjutkan</p>
                      <p style={{ fontSize:11, color:S.gray, marginBottom:10 }}>Ketersediaan produk berubah. Hapus item berikut langsung dari checkout.</p>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        {stockIssues.map((issue, i) => {
                          const item = issue.branchIndex !== undefined && issue.itemIndex !== undefined
                            ? grouped[issue.branchIndex]?.items[issue.itemIndex]
                            : undefined

                          return (
                            <div key={`${issue.message}-${i}`} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'9px 10px', background:'#fff', borderRadius:8 }}>
                              <span style={{ fontSize:12, color:S.dark, lineHeight:1.45 }}>{issue.message}</span>
                              {item && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id, item.branchId)}
                                  style={{ flexShrink:0, border:0, background:'rgba(196,30,58,.08)', color:S.red, borderRadius:7, padding:'6px 9px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                                  Hapus
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <VoucherInput preview={activePromoPreview} promoCode={promoCode} loading={promoLoading} onApplyCode={applyPromo} onRemoveCode={() => setPromoCode(null)} />

              <AffiliateCodeInput affiliateName={affiliateName} code={affiliateCode} loading={applyingAffiliate} onApplyCode={applyAffiliateCode} onRemoveCode={removeAffiliateCode} />

              <div style={{ display:'flex', alignItems:'center', gap:12, padding:14, marginBottom:20, background:'rgba(27,58,107,0.05)', border:'1px solid rgba(27,58,107,0.12)', borderRadius:12 }}>
                <div style={{ width:42, height:42, borderRadius:10, background:S.navy, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💳</div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:S.navy }}>Pembayaran aman melalui Midtrans</p>
                  <p style={{ fontSize:11, color:S.gray, lineHeight:1.5, marginTop:2 }}>Transfer bank, VA, QRIS, dan metode lain tersedia di halaman Midtrans.</p>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>Catatan (opsional)</label>
                <textarea className="c-input" style={{ resize:'none', height:76 }} placeholder="Catatan untuk semua cabang..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {selectedBranchCount > 1 && (
                <div style={{ background:'rgba(27,58,107,0.05)', border:'1px solid rgba(27,58,107,0.1)', borderRadius:10, padding:12, marginBottom:16, fontSize:12, color:S.navy }}>
                  ℹ️ <strong>{selectedBranchCount} pesanan terpisah</strong> dengan 1 kali pembayaran.
                </div>
              )}

              <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                <button onClick={() => setStep(2)} className="c-btn c-btn-ghost c-btn-md" style={{ flex:1 }}>← Kembali</button>
                <button onClick={placeOrder} disabled={loading || promoLoading || !activePromoPreview}
                  className="c-btn c-btn-navy c-btn-md" style={{ flex:2 }}>
                  {loading ? '⏳ Memproses...' : `💳 Bayar ${formatRupiah(grandTotal)}`}
                </button>
              </div>

              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:8 }}>
                {['🔒 SSL','Midtrans','PCI DSS'].map(t => (
                  <span key={t} style={{ fontSize:10, color:S.gray, background:S.grayL, padding:'3px 8px', borderRadius:4 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar grouped={grouped} branchStates={branchStates} preview={activePromoPreview} />
      </div>

      {showOTP && (
        <OTPModal open={showOTP} phone={'0'+phone} name={name} email={email}
          onClose={() => setShowOTP(false)}
          onVerified={() => { setShowOTP(false); setStep(2) }} />
      )}
    </div>
  )
}
