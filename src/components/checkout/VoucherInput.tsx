'use client'

import { formatRupiah } from '@/lib/utils'
import type { PromotionPreview, PromotionSummary } from '@/types'
import { useState } from 'react'

const S = {
  red: '#C41E3A', navy: '#1B3A6B', creamDp: '#EDD9B8', creamD: '#F5EDD9',
  gray: '#6B7280', grayL: '#F3F0EB', green: '#10B981', dark: '#1A1A2E',
}

interface Props {
  preview: PromotionPreview | null
  promoCodes: string[]
  loading: boolean
  onApplyCode: (code: string) => Promise<boolean>
  onRemoveCode: (code: string) => void
}

function targetLabel(promo: PromotionSummary) {
  if (promo.scope === 'product') return 'Promo produk'
  if (promo.scope === 'order') return 'Promo belanja'
  if (promo.delivery_scope === 'instant') return 'Khusus instant'
  if (promo.delivery_scope === 'non_instant') return 'Khusus non-instant'
  return 'Promo pengiriman'
}

export default function VoucherInput({ preview, promoCodes, loading, onApplyCode, onRemoveCode }: Props) {
  const [code, setCode] = useState('')

  async function apply(codeToApply = code) {
    const normalized = codeToApply.trim().toUpperCase()
    if (!normalized) return

    const success = await onApplyCode(normalized)
    if (success) setCode('')
  }

  const offers = preview?.available_promotions.filter(
    promo => promo.eligible && !promo.applied
  ) ?? []
  const appliedCodePromos = preview?.applied_promotions.filter(
    promo => promo.application_mode === 'code' && promo.code && promoCodes.includes(promo.code)
  ) ?? []
  const currentCodesAreStackable = appliedCodePromos.every(promo => promo.is_stackable)
  const canAddCode = promoCodes.length === 0 || currentCodesAreStackable

  function remove(codeToRemove: string) {
    onRemoveCode(codeToRemove)
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: S.navy }}>Promo & penawaran</h3>
          <p style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>Promo otomatis sudah dihitung dengan kombinasi paling hemat.</p>
        </div>
        {loading && <span style={{ fontSize: 11, color: S.gray }}>Menghitung…</span>}
      </div>

      {preview?.applied_promotions.map(promo => (
        <div key={promo.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 10, padding: '11px 13px', marginBottom: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>{promo.name}</span>
              <span style={{ fontSize:11, color: S.green, background: '#fff', borderRadius: 4, padding: '2px 5px' }}>
                {promo.application_mode === 'automatic' ? 'OTOMATIS' : promo.code}
              </span>
            </div>
            <p style={{ fontSize: 11, color: S.green, marginTop: 3 }}>Hemat {formatRupiah(promo.discount_amount)} · {targetLabel(promo)}</p>
          </div>
          {promo.application_mode === 'code' && promo.code && promoCodes.includes(promo.code) && (
            <button type="button" onClick={() => remove(promo.code!)} aria-label={`Lepas kode promo ${promo.code}`} style={{ background: 'none', border: 0, color: S.gray, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      ))}

      {canAddCode && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            value={code}
            onChange={event => setCode(event.target.value.toUpperCase())}
            onKeyDown={event => event.key === 'Enter' && apply()}
            placeholder={promoCodes.length > 0 ? 'Tambah kode promo' : 'Punya kode promo?'}
            className="c-input"
            style={{ flex: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.6px' }}
          />
          <button type="button" onClick={() => apply()} disabled={loading || !code.trim()} className="c-btn c-btn-primary c-btn-sm">
            Pakai
          </button>
        </div>
      )}

      {offers.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: S.dark, marginBottom: 7 }}>Promo tersedia</p>
          <div style={{ display: 'grid', gap: 7 }}>
            {offers.map(promo => (
              <div key={promo.id} style={{ border: `1px solid ${S.creamDp}`, background: S.creamD, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: S.navy }}>{promo.name}</span>
                      {promo.badge_text && <span style={{ fontSize:11, color: S.red, background: '#fff', borderRadius: 4, padding: '2px 5px' }}>{promo.badge_text}</span>}
                    </div>
                    {promo.description && <p style={{ fontSize:11, color: S.gray, marginTop: 3 }}>{promo.description}</p>}
                    <p style={{ fontSize:11, color: promo.eligible ? S.green : S.gray, marginTop: 4 }}>
                      {promo.reason ?? (promo.eligible ? 'Memenuhi syarat; sistem memilih kombinasi diskon terbesar.' : 'Belum memenuhi syarat.')}
                    </p>
                    <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize:11, color: S.navy, background: '#fff', borderRadius: 4, padding: '2px 5px' }}>{targetLabel(promo)}</span>
                      <span style={{ fontSize:11, color: promo.is_stackable ? S.green : S.red, background: '#fff', borderRadius: 4, padding: '2px 5px' }}>
                        {promo.is_stackable ? 'Bisa digabung' : 'Promo eksklusif'}
                      </span>
                    </div>
                  </div>
                  {promo.application_mode === 'code' && promo.code && promo.eligible && (
                    <button
                      type="button"
                      onClick={() => apply(promo.code ?? '')}
                      disabled={loading || promoCodes.includes(promo.code) || (promoCodes.length > 0 && (!promo.is_stackable || !currentCodesAreStackable))}
                      className="c-btn c-btn-primary c-btn-sm"
                      style={{ alignSelf: 'center', flexShrink: 0 }}>
                      Pakai
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
