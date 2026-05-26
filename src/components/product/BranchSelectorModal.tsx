'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import type { Branch, Product } from '@/types'

interface Props {
  product: Product
  onSelect: (branch: Branch) => void
  onClose: () => void
}

export default function BranchSelectorModal({ product, onSelect, onClose }: Props) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/branches')
      .then(r => setBranches(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div onClick={onClose} className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 200 }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 201, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div className="animate-modal-in" style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 700, color: '#1B3A6B', marginBottom: 4 }}>Pilih Cabang</h2>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Untuk pesanan <strong>{product.name}</strong></p>
            </div>
            <button onClick={onClose} style={{ background: '#F3F0EB', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Branches */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280', fontSize: 13 }}>Memuat cabang...</div>
          ) : branches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#6B7280', fontSize: 13 }}>Tidak ada cabang tersedia</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {branches.map(b => (
                <button key={b.id} onClick={() => onSelect(b)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: '1.5px solid #EDD9B8', borderRadius: 12, background: '#fff', cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C41E3A'; e.currentTarget.style.background = 'rgba(196,30,58,0.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDD9B8'; e.currentTarget.style.background = '#fff' }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(196,30,58,0.08)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📍</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', marginBottom: 2 }}>{b.name}</p>
                    <p style={{ fontSize: 11, color: '#6B7280' }}>{b.address}</p>
                    <p style={{ fontSize: 11, color: '#10B981', marginTop: 3, fontWeight: 500 }}>✓ Tersedia{b.hours ? ` · ${b.hours}` : ''}</p>
                  </div>
                  <span style={{ color: '#C41E3A', fontSize: 18 }}>›</span>
                </button>
              ))}
            </div>
          )}

          <button onClick={onClose} className="c-btn c-btn-ghost c-btn-full">Batal</button>
        </div>
      </div>
    </>
  )
}
