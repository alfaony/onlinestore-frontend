'use client'
import { formatRupiah } from '@/lib/utils'
import {
  isPreparationAllocationComplete,
  normalizePreparationAllocation,
  type PreparationAllocation,
} from '@/lib/preparation'
import { getPreparationMethods, type CartItem } from '@/stores/cart.store'
import type { Branch } from '@/types'
import { useEffect, useState } from 'react'
import type { AddressPayload } from './AddressForm'
import PickupScheduler from './PickupScheduler'
import PreparationOptions from './PreparationOptions'
import type { Rate } from './ShippingOptions'
import ShippingOptions from './ShippingOptions'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E',
  green:'#10B981', gold:'#E8A020', creamD:'#F5EDD9',
}

export type BranchFulfillment = 'delivery' | 'pickup'

export interface BranchShippingState {
  fulfillment: BranchFulfillment
  rate: Rate | null
  pickup: { datetime: string; note: string } | null
  preparations: Record<string, PreparationAllocation>
}

export interface CheckoutValidationIssue {
  branchId?: string
  targetId: string
  message: string
  requestId: number
}

interface Props {
  branch: Branch
  items: CartItem[]
  address: AddressPayload | null
  state: BranchShippingState
  onChange: (state: BranchShippingState) => void
  index: number
  validationIssue?: CheckoutValidationIssue | null
}

// ── Toggle kecil per branch ───────────────────────────────
function MiniToggle({ value, onChange, canPickup }: {
  value: BranchFulfillment
  onChange: (v: BranchFulfillment) => void
  canPickup: boolean
}) {
  return (
    <div className="branch-fulfillment-toggle" style={{ display:'flex', background:S.grayL, borderRadius:8, padding:3, gap:3 }}>
      {[
        { key:'delivery' as const, icon:'🚚', label:'Diantar' },
        { key:'pickup'   as const, icon:'🏃', label:'Ambil sendiri' },
      ].map(opt => {
        const active = value === opt.key
        const disabled = opt.key === 'pickup' && !canPickup
        return (
          <button
            key={opt.key}
            type="button"
            disabled={disabled}
            title={disabled ? 'Ambil sendiri tidak tersedia: ada produk yang harus dimasak, tetapi cabang ini belum melayani masak.' : undefined}
            onClick={e => { e.stopPropagation(); if (!disabled) onChange(opt.key) }}
            style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'6px 12px', borderRadius:6,
              border:'none',
              background: active ? '#fff' : 'transparent',
              color: active ? S.red : S.gray,
              fontSize:12, fontWeight: active ? 600 : 400,
              cursor:disabled ? 'not-allowed' : 'pointer', transition:'all 0.18s',
              opacity:disabled ? 0.45 : 1,
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            <span style={{ fontSize:14 }}>{opt.icon}</span>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Status summary (collapsed state) ─────────────────────
function BranchStatusSummary({ state }: {
  state: BranchShippingState
}) {
  if (state.fulfillment === 'pickup') {
    if (state.pickup) {
      const date = new Date(state.pickup.datetime)
      const label = date.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })
      const time  = state.pickup.datetime.split(' ')[1]?.slice(0,5)
      return (
        <div className="branch-status-summary" style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:S.green }}>
          <span>✓</span>
          <span className="branch-status-summary__copy">Ambil sendiri {label} {time} · Gratis ongkir</span>
        </div>
      )
    }
    return <span style={{ fontSize:11, color:S.gold }}>⏳ Pilih jadwal pengambilan</span>
  }

  if (state.rate) {
    return (
      <div className="branch-status-summary" style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:S.green }}>
        <span>✓</span>
        <span className="branch-status-summary__copy">{state.rate.courier_name} {state.rate.service_name} · {formatRupiah(state.rate.price + state.rate.insurance_fee)}</span>
        {state.rate.is_instant && <span style={{ color:S.gold }}>⚡</span>}
      </div>
    )
  }

  return <span style={{ fontSize:11, color:S.gold }}>⏳ Pilih kurir pengiriman</span>
}

// ── Main Card ─────────────────────────────────────────────
export default function BranchShippingCard({ branch, items, address, state, onChange, index, validationIssue }: Props) {
  const [expanded, setExpanded] = useState(true)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const supportsCooking = branch.can_cook && !branch.sells_frozen_only
  const allSupportFrozen = items.every(item => getPreparationMethods(item).includes('frozen'))
  const canPickup = supportsCooking || allSupportFrozen
  const requiresPreparation = supportsCooking && (
    state.fulfillment === 'pickup' || !!state.rate?.is_instant
  )
  const preparationComplete = !requiresPreparation
    || items.every(item => isPreparationAllocationComplete(item, state.preparations?.[item.id]))
  const fulfillmentComplete = state.fulfillment === 'pickup' ? !!state.pickup : !!state.rate
  const isComplete = fulfillmentComplete && preparationComplete
  const operational = branch.operational_status
  const contentId = `branch-shipping-content-${branch.id}`
  const branchTargetId = `checkout-branch-${branch.id}`
  const shippingTargetId = `checkout-shipping-${branch.id}`
  const preparationTargetId = `checkout-preparation-${branch.id}`
  const pickupTargetId = `checkout-pickup-${branch.id}`
  const validationBelongs = validationIssue?.branchId === branch.id
  const validationTargetId = validationBelongs ? validationIssue.targetId : null
  const displayedExpanded = expanded || validationBelongs

  useEffect(() => {
    if (!validationTargetId) return

    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const target = document.getElementById(validationTargetId)
        if (!target) return
        target.focus({ preventScroll:true })
        target.scrollIntoView({ behavior:'smooth', block:'center' })
      })
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      if (secondFrame) cancelAnimationFrame(secondFrame)
    }
  }, [validationIssue?.requestId, validationTargetId])

  function normalizedPreparations(): Record<string, PreparationAllocation> {
    return items.reduce<Record<string, PreparationAllocation>>((result, item) => {
      const allocation = normalizePreparationAllocation(item, state.preparations?.[item.id])
      if (Object.keys(allocation).length > 0) result[item.id] = allocation
      return result
    }, {})
  }

  function setFulfillment(f: BranchFulfillment) {
    if (f === state.fulfillment) return
    onChange({
      ...state,
      fulfillment: f,
      rate: null,
      pickup: null,
      preparations: supportsCooking ? normalizedPreparations() : {},
    })
    setExpanded(true)
  }

  function setRate(rate: Rate | null) {
    if (!rate?.is_instant) {
      onChange({ ...state, rate, preparations: {} })
      setExpanded(true)
      return
    }

    onChange({ ...state, rate, preparations: normalizedPreparations() })
    setExpanded(true)
  }

  function setPickup(datetime: string, note: string) {
    onChange({ ...state, pickup: { datetime, note } })
    setExpanded(true)
  }

  function setPreparation(productId: string, allocation: PreparationAllocation) {
    onChange({
      ...state,
      preparations: { ...(state.preparations ?? {}), [productId]: allocation },
    })
    setExpanded(true)
  }

  const validationMessage = (targetId: string) => validationTargetId === targetId ? (
    <p className="checkout-validation-message" role="alert">{validationIssue?.message}</p>
  ) : null

  const preparationControl = requiresPreparation ? (
    <div
      id={preparationTargetId}
      className="checkout-validation-target"
      data-checkout-invalid={validationTargetId === preparationTargetId ? 'true' : undefined}
      tabIndex={-1}
    >
      {validationMessage(preparationTargetId)}
      <PreparationOptions
        items={items}
        values={state.preparations ?? {}}
        onChange={setPreparation}
        mode={state.fulfillment === 'pickup' ? 'pickup' : 'instant'}
        titleId={`preparation-title-${branch.id}`}
      />
    </div>
  ) : null

  return (
    <div
      id={branchTargetId}
      className="branch-shipping-card checkout-validation-target"
      data-checkout-invalid={validationTargetId === branchTargetId ? 'true' : undefined}
      tabIndex={-1}
      style={{
      border:`1.5px solid ${isComplete ? 'rgba(16,185,129,0.3)' : S.creamDp}`,
      borderRadius:16,
      overflow:'hidden',
      marginBottom:12,
      transition:'border-color 0.2s',
    }}>

      {/* ── Header ── */}
      <div
        className="branch-shipping-header"
        style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px',
          background: isComplete ? 'rgba(16,185,129,0.04)' : '#fafafa',
          userSelect:'none',
          borderBottom: displayedExpanded ? `1px solid ${S.creamDp}` : 'none',
        }}>

        {/* Left: nomor + nama branch */}
        <div className="branch-shipping-title" style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:26, height:26, borderRadius:'50%',
            background: isComplete ? S.green : S.navy,
            color:'#fff', fontSize:11, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            {isComplete ? '✓' : index + 1}
          </div>
          <div>
            <p style={{ fontSize:13, fontWeight:700, color:S.dark, marginBottom:2 }}>
              {branch.name}
            </p>
            <p style={{ fontSize:11, color:S.gray }}>
              {items.length} item · {formatRupiah(subtotal)}
            </p>
            {!displayedExpanded && isComplete && (
              <BranchStatusSummary state={state} />
            )}
          </div>
        </div>

        {/* Right: toggle + chevron */}
        <div className="branch-shipping-controls" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <MiniToggle value={state.fulfillment} onChange={setFulfillment} canPickup={canPickup} />
          <button
            type="button"
            className="branch-shipping-collapse"
            aria-expanded={displayedExpanded}
            aria-controls={contentId}
            aria-label={displayedExpanded ? `Tutup pilihan pengiriman ${branch.name}` : `Buka pilihan pengiriman ${branch.name}`}
            onClick={() => setExpanded(value => !value)}
          >
            <span aria-hidden="true" style={{
              transform: displayedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition:'transform 0.2s', display:'inline-block',
            }}>▾</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {displayedExpanded && (
        <div id={contentId} className="branch-shipping-content" style={{ padding:'16px 16px' }}>

          {validationMessage(branchTargetId)}

          {operational && operational.code !== 'open' && (
            <div style={{ padding:'10px 12px', borderRadius:9, marginBottom:14, background:operational.accepting_orders?'rgba(232,160,32,.08)':'rgba(196,30,58,.07)', border:`1px solid ${operational.accepting_orders?'rgba(232,160,32,.25)':'rgba(196,30,58,.2)'}`, color:operational.accepting_orders?'#92600A':S.red, fontSize:11, lineHeight:1.5 }}>
              <strong>{operational.label}.</strong> {operational.message}
            </div>
          )}

          {operational && !operational.accepting_orders ? null : state.fulfillment === 'delivery' ? (
            <>
              {/* Info alamat kalau sudah diisi */}
              {address ? (
                <div className="branch-shipping-address" style={{
                  display:'flex', alignItems:'center', gap:8,
                  padding:'8px 12px', borderRadius:8,
                  background:'rgba(27,58,107,0.04)', marginBottom:14,
                  fontSize:11, color:S.navy,
                }}>
                  <span>📍</span>
                  <span>
                    {address.address}
                    {address.regency_name ? `, ${address.regency_name}` : ''}
                    {address.postal_code ? ` ${address.postal_code}` : ''}
                  </span>
                </div>
              ) : (
                <div style={{
                  padding:'8px 12px', borderRadius:8,
                  background:'rgba(232,160,32,0.06)', marginBottom:14,
                  fontSize:11, color:'#92600A',
                }}>
                  ⚠️ Isi alamat pengiriman di atas terlebih dahulu
                </div>
              )}

              <div
                id={shippingTargetId}
                className="checkout-validation-target"
                data-checkout-invalid={validationTargetId === shippingTargetId ? 'true' : undefined}
                tabIndex={-1}
              >
                {validationMessage(shippingTargetId)}
                <ShippingOptions
                  address={address}
                  branchId={branch.id}
                  items={items}
                  onSelect={setRate}
                />
              </div>

              {preparationControl}

              {state.rate?.is_instant && !supportsCooking && (
                <div className="preparation-frozen-notice">
                  <span>❄️</span>
                  <span><strong>Dikirim frozen.</strong> Cabang ini belum melayani pilihan masak.</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{
                padding:'8px 12px', borderRadius:8,
                background:'rgba(16,185,129,0.06)',
                border:'1px solid rgba(16,185,129,0.2)',
                fontSize:11, color:S.green, marginBottom:14,
              }}>
                ✓ Gratis biaya pengiriman untuk pickup
              </div>

              {preparationControl}

              {!supportsCooking && (
                <div className="preparation-frozen-notice">
                  <span>❄️</span>
                  <span><strong>Diambil frozen.</strong> Cabang ini belum melayani pilihan masak.</span>
                </div>
              )}

              <div
                id={pickupTargetId}
                className="checkout-validation-target"
                data-checkout-invalid={validationTargetId === pickupTargetId ? 'true' : undefined}
                tabIndex={-1}
              >
                {validationMessage(pickupTargetId)}
                <PickupScheduler
                  branch={branch}
                  onSelect={setPickup}
                />
              </div>
            </>
          )}

          {/* Summary bawah card */}
          {(isComplete || requiresPreparation) && (
            <div className="branch-shipping-summary" style={{
              marginTop:12, paddingTop:12,
              borderTop:`1px dashed ${S.creamDp}`,
              display:'flex', justifyContent:'space-between',
              alignItems:'center',
            }}>
              {isComplete ? (
                <BranchStatusSummary state={state} />
              ) : (
                <span style={{ fontSize:11, color:S.gold }}>
                  {preparationComplete ? '⏳ Pilih jadwal pengambilan' : '⏳ Lengkapi pilihan olahan'}
                </span>
              )}
              {isComplete && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  style={{ fontSize:11, color:S.navy, background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
                  Selesai ✓
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
