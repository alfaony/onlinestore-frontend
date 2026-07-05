'use client'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import type { Branch, Product } from '@/types'
import Modal from '@/components/ui/Modal'
import { useEffect, useState } from 'react'

interface Props {
  product: Product
  onClose: () => void
}

export default function BranchSelectorModal({ product, onClose }: Props) {
  const [branches, setBranches] = useState<Branch[]>([])
  const setActiveBranch = useCartStore(s => s.setActiveBranch)
  const addItem          = useCartStore(s => s.addItem)

  useEffect(() => {
    api.get('/branches').then(({ data }) => {
      let list: Branch[] = Array.isArray(data) ? data : []

      // ✅ Filter hanya branch yang punya produk ini
      if (product.branch_availability && product.branch_availability.length > 0) {
        list = list.filter(b => product.branch_availability!.includes(b.id))
      }

      setBranches(list)
    })
  }, [])

  function handleSelect(branch: Branch) {
    setActiveBranch({ id: branch.id, name: branch.name })
    addItem(product, 1, branch)
    onClose()
  }

  return (
    <Modal open onClose={onClose} titleId="branch-selector-title" maxWidth={420}>
      <div style={{ padding:22 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16 }}>
          <div>
            <span style={{ fontSize:11, fontWeight:700, color:'#C41E3A', letterSpacing:'.08em' }}>PILIH TOKO</span>
            <h3 id="branch-selector-title" style={{ fontFamily:'var(--font-display)', fontSize:24, lineHeight:1.1, fontWeight:700, color:'#1B3A6B', marginTop:3 }}>
              {product.name}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup modal" style={{ width:34, height:34, borderRadius:10, border:0, background:'#F3F0EB', color:'#6B7280', fontSize:17 }}>×</button>
        </div>
        <p style={{ fontSize:12, color:'#6B7280', marginBottom:16 }}>
          {branches.length === 0
            ? 'Produk ini sedang tidak tersedia di cabang manapun'
            : 'Pilih cabang untuk pesan produk ini:'
          }
        </p>

        {branches.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:'#6B7280', fontSize:13 }}>
            😔 Mohon coba lagi nanti
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {branches.map(b => (
              <button key={b.id} onClick={() => handleSelect(b)}
                style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 14px', border:'1.5px solid #EDD9B8', borderRadius:12, background:'#fff', cursor:'pointer', textAlign:'left' }}>
                <span style={{ display:'grid', placeItems:'center', width:38, height:38, borderRadius:10, background:'rgba(27,58,107,.07)', fontSize:18, flexShrink:0 }}>📍</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1A1A2E' }}>{b.name}</div>
                  <div style={{ fontSize:11, color:'#6B7280' }}>{b.address}</div>
                  <p style={{ fontSize:11, color:'#10B981', marginTop:2 }}>✓ Tersedia</p>
                </div>
                <span style={{ color:'#1B3A6B' }}>→</span>
              </button>
            ))}
          </div>
        )}

        <button onClick={onClose} className="c-btn c-btn-ghost c-btn-md c-btn-full" style={{ marginTop:14 }}>
          Tutup
        </button>
      </div>
    </Modal>
  )
}
