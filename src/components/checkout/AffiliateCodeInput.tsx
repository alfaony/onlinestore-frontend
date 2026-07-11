'use client'

import { useAffiliateStore } from '@/stores/affiliate.store'
import { useState } from 'react'

const S = {
  navy: '#1B3A6B', gray: '#6B7280', green: '#10B981',
}

interface Props {
  affiliateName: string | null
  code: string | null
  loading: boolean
  onApplyCode: (code: string) => Promise<boolean>
  onRemoveCode: () => void
}

export default function AffiliateCodeInput({ affiliateName, code, loading, onApplyCode, onRemoveCode }: Props) {
  const storedCode = useAffiliateStore(state => state.code)
  const [input, setInput] = useState(code ?? storedCode ?? '')

  async function apply(codeToApply = input) {
    const normalized = codeToApply.trim().toUpperCase()
    if (!normalized) return

    const success = await onApplyCode(normalized)
    if (success) setInput(normalized)
  }

  function remove() {
    setInput('')
    onRemoveCode()
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: S.navy, marginBottom: 8 }}>Kode Affiliate</h3>

      {code && affiliateName ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: 10, padding: '11px 13px' }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>{code}</span>
            <p style={{ fontSize: 11, color: S.green, marginTop: 3 }}>Direferensikan oleh {affiliateName}</p>
          </div>
          <button type="button" onClick={remove} aria-label="Hapus kode affiliate" style={{ background: 'none', border: 0, color: S.gray, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={event => setInput(event.target.value.toUpperCase())}
            onKeyDown={event => event.key === 'Enter' && apply()}
            placeholder="Punya kode affiliate?"
            className="c-input"
            style={{ flex: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.6px' }}
          />
          <button type="button" onClick={() => apply()} disabled={loading || !input.trim()} className="c-btn c-btn-primary c-btn-sm">
            Terapkan
          </button>
        </div>
      )}
    </section>
  )
}
