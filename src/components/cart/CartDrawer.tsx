'use client'
import Link from 'next/link'
import {
  useCartStore,
  useCartItems,
  useCartTotal,
  useCartCount,
  useCartBranchCount,
  groupCartByBranch,
} from '@/stores/cart.store'
import { useMemo } from 'react'
import { formatRupiah } from '@/lib/utils'

const S = {
  red: '#C41E3A', navy: '#1B3A6B', creamDp: '#EDD9B8',
  gray: '#6B7280', grayL: '#F3F0EB', dark: '#1A1A2E', creamD: '#F5EDD9',
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCartItems()          // ✅ useShallow, stable
  const total = useCartTotal()          // ✅ number, stable
  const count = useCartCount()          // ✅ number, stable
  const branchCount = useCartBranchCount()    // ✅ number, stable
  const updateQty = useCartStore(s => s.updateQty)
  const removeItem = useCartStore(s => s.removeItem)

  // ✅ useMemo agar grouped tidak recompute kecuali items berubah
  const grouped = useMemo(() => groupCartByBranch(items), [items])


  return (
    <>
      {open && <div onClick={onClose} className="animate-fade-in" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }} />}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100%', width: '100%', maxWidth: 400, background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.12)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(.32,.72,0,1)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${S.creamDp}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: S.navy }}>Keranjang</h2>
            {count > 0 && <p style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>{count} item · {branchCount} cabang · {formatRupiah(total)}</p>}
          </div>
          <button onClick={onClose} style={{ background: S.grayL, border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 15, color: S.gray, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {grouped.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', paddingBottom: 40 }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🛒</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: S.navy, marginBottom: 6 }}>Masih kosong</h3>
              <p style={{ color: S.gray, fontSize: 13, marginBottom: 20 }}>Yuk tambahkan menu favoritmu!</p>
              <button onClick={onClose} className="c-btn c-btn-outline c-btn-sm">Lihat Menu</button>
            </div>
          ) : grouped.map(({ branchId, branchName, items, subtotal }) => (
            <div key={branchId} style={{ marginBottom: 20 }}>
              {/* Branch header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(27,58,107,0.06)', borderRadius: 8, marginBottom: 10 }}>
                <span>📍</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: S.navy }}>{branchName}</span>
              </div>

              {/* Items */}
              {items.map(item => (
                <div key={`${item.id}_${branchId}`} style={{ display: 'flex', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${S.grayL}` }}>
                  <div style={{ width: 52, height: 52, background: S.creamD, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🍜</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, color: S.dark, marginBottom: 2 }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: S.red, fontWeight: 700, marginBottom: 6 }}>{formatRupiah(item.price)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: S.grayL, borderRadius: 8, padding: '3px 8px' }}>
                        <button onClick={() => updateQty(item.id, branchId, item.qty - 1)} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: S.dark, width: 18 }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, branchId, item.qty + 1)} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', color: S.dark, width: 18 }}>+</button>
                      </div>
                      <span style={{ fontSize: 11, color: S.gray }}>{formatRupiah(item.price * item.qty)}</span>
                      <button onClick={() => removeItem(item.id, branchId)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#E5E2DC', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Branch subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: 11, color: S.gray }}>Subtotal {branchName}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{formatRupiah(subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {grouped.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: `1px solid ${S.creamDp}` }}>
            {branchCount > 1 && (
              <div style={{ background: 'rgba(27,58,107,0.06)', border: '1px solid rgba(27,58,107,0.1)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: S.navy }}>
                ℹ️ Pesanan dari {branchCount} cabang dikirim terpisah
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 600, color: S.dark }}>Total Semua</span>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, color: S.red }}>{formatRupiah(total)}</span>
            </div>
            <Link href="/checkout" onClick={onClose} className="c-btn c-btn-primary c-btn-lg c-btn-full">
              Checkout Sekarang →
            </Link>
            <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: S.gray, border: 'none', padding: '10px', fontSize: 12, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", marginTop: 6 }}>
              Lanjut Belanja
            </button>
          </div>
        )}
      </div>
    </>
  )
}
