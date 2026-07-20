'use client'
import { formatRupiah } from '@/lib/utils'
import {
  isPreparationAllocationComplete,
  normalizePreparationAllocation,
  type PreparationAllocation,
} from '@/lib/preparation'
import { getPreparationMethods, type CartItem } from '@/stores/cart.store'
import type { Branch } from '@/types'
import { useState } from 'react'
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

interface Props {
  branch: Branch
  items: CartItem[]
  address: AddressPayload | null
  state: BranchShippingState
  onChange: (state: BranchShippingState) => void
  index: number
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
            disabled={disabled}
            title={disabled ? 'Ambil sendiri tidak tersedia karena ada produk tanpa opsi Frozen.' : undefined}
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
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:S.green }}>
          <span>✓</span>
          <span>Ambil sendiri {label} {time} · Gratis ongkir</span>
        </div>
      )
    }
    return <span style={{ fontSize:11, color:S.gold }}>⏳ Pilih jadwal pengambilan</span>
  }

  if (state.rate) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:S.green }}>
        <span>✓</span>
        <span>{state.rate.courier_name} {state.rate.service_name} · {formatRupiah(state.rate.price + state.rate.insurance_fee)}</span>
        {state.rate.is_instant && <span style={{ color:S.gold }}>⚡</span>}
      </div>
    )
  }

  return <span style={{ fontSize:11, color:S.gold }}>⏳ Pilih kurir pengiriman</span>
}

// ── Main Card ─────────────────────────────────────────────
export default function BranchShippingCard({ branch, items, address, state, onChange, index }: Props) {
  const [expanded, setExpanded] = useState(true)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const supportsCooking = branch.can_cook && !branch.sells_frozen_only
  const allSupportFrozen = items.every(item => getPreparationMethods(item).includes('frozen'))
  const requiresPreparation = state.fulfillment === 'delivery'
    && !!state.rate?.is_instant
    && supportsCooking
  const preparationComplete = !requiresPreparation
    || items.every(item => isPreparationAllocationComplete(item, state.preparations?.[item.id]))
  const isComplete = state.fulfillment === 'pickup'
    ? !!state.pickup
    : !!state.rate && preparationComplete
  const operational = branch.operational_status

  function setFulfillment(f: BranchFulfillment) {
    onChange({ ...state, fulfillment: f, rate: null, pickup: null, preparations: {} })
    setExpanded(true)
  }

  function setRate(rate: Rate | null) {
    if (!rate?.is_instant) {
      onChange({ ...state, rate, preparations: {} })
      return
    }

    const preparations = { ...(state.preparations ?? {}) }
    items.forEach(item => {
      const allocation = normalizePreparationAllocation(item, preparations[item.id])
      if (Object.keys(allocation).length > 0) preparations[item.id] = allocation
      else delete preparations[item.id]
    })

    onChange({ ...state, rate, preparations })
  }

  function setPickup(datetime: string, note: string) {
    onChange({ ...state, pickup: { datetime, note } })
  }

  function setPreparation(productId: string, allocation: PreparationAllocation) {
    onChange({
      ...state,
      preparations: { ...(state.preparations ?? {}), [productId]: allocation },
    })
  }

  return (
    <div style={{
      border:`1.5px solid ${isComplete ? 'rgba(16,185,129,0.3)' : S.creamDp}`,
      borderRadius:16,
      overflow:'hidden',
      marginBottom:12,
      transition:'border-color 0.2s',
    }}>

      {/* ── Header — klik untuk collapse/expand ── */}
      <div
        className="branch-shipping-header"
        onClick={() => setExpanded(v => !v)}
        style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 16px',
          background: isComplete ? 'rgba(16,185,129,0.04)' : '#fafafa',
          cursor:'pointer', userSelect:'none',
          borderBottom: expanded ? `1px solid ${S.creamDp}` : 'none',
        }}>

        {/* Left: nomor + nama branch */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
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
            {!expanded && isComplete && (
              <BranchStatusSummary state={state} />
            )}
          </div>
        </div>

        {/* Right: toggle + chevron */}
        <div className="branch-shipping-controls" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <MiniToggle value={state.fulfillment} onChange={setFulfillment} canPickup={allSupportFrozen} />
          <span style={{
            color:S.gray, fontSize:16, lineHeight:1,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition:'transform 0.2s', display:'inline-block',
          }}>
            ▾
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      {expanded && (
        <div style={{ padding:'16px 16px' }}>

          {operational && operational.code !== 'open' && (
            <div style={{ padding:'10px 12px', borderRadius:9, marginBottom:14, background:operational.accepting_orders?'rgba(232,160,32,.08)':'rgba(196,30,58,.07)', border:`1px solid ${operational.accepting_orders?'rgba(232,160,32,.25)':'rgba(196,30,58,.2)'}`, color:operational.accepting_orders?'#92600A':S.red, fontSize:11, lineHeight:1.5 }}>
              <strong>{operational.label}.</strong> {operational.message}
            </div>
          )}

          {operational && !operational.accepting_orders ? null : state.fulfillment === 'delivery' ? (
            <>
              {/* Info alamat kalau sudah diisi */}
              {address ? (
                <div style={{
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

              <ShippingOptions
                address={address}
                branchId={branch.id}
                items={items}
                onSelect={setRate}
              />

              {requiresPreparation && (
                <PreparationOptions
                  items={items}
                  values={state.preparations ?? {}}
                  onChange={setPreparation}
                />
              )}

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
              <PickupScheduler
                branch={branch}
                onSelect={setPickup}
              />
            </>
          )}

          {/* Summary bawah card */}
          {(isComplete || (state.rate && requiresPreparation)) && (
            <div style={{
              marginTop:12, paddingTop:12,
              borderTop:`1px dashed ${S.creamDp}`,
              display:'flex', justifyContent:'space-between',
              alignItems:'center',
            }}>
              {isComplete
                ? <BranchStatusSummary state={state} />
                : <span style={{ fontSize:11, color:S.gold }}>⏳ Lengkapi pilihan olahan</span>}
              {isComplete && (
                <button
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
