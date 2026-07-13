'use client'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import type { Branch, Product } from '@/types'
import Modal from '@/components/ui/Modal'
import { formatRupiah } from '@/lib/utils'
import { ArrowRight, LoaderCircle, MapPin, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Props {
  product: Product
  onClose: () => void
}

export default function BranchSelectorModal({ product, onClose }: Props) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null)
  const activeBranch = useCartStore(s => s.activeBranch)
  const setActiveBranch = useCartStore(s => s.setActiveBranch)
  const addItem          = useCartStore(s => s.addItem)
  const router = useRouter()
  const loading = loadedProductId !== product.id

  useEffect(() => {
    let active = true

    api.get('/branches')
      .then(({ data }) => {
        let list: Branch[] = Array.isArray(data) ? data : []

        // Daftar kosong berarti produk memang tidak tersedia, bukan tersedia di semua cabang.
        const availableBranchIds = product.branch_availability ?? []
        list = list.filter(branch => availableBranchIds.includes(branch.id))

        if (active) setBranches(list)
      })
      .catch(() => { if (active) setBranches([]) })
      .finally(() => { if (active) setLoadedProductId(product.id) })

    return () => { active = false }
  }, [product.branch_availability, product.id])

  function handleSelect(branch: Branch) {
    setActiveBranch({ id: branch.id, name: branch.name })
    addItem(product, 1, branch)
    onClose()

    if (window.location.pathname === '/menu') {
      const params = new URLSearchParams(window.location.search)
      params.set('branch_id', branch.id)
      router.replace(`/menu?${params.toString()}`, { scroll: false })
    }
  }

  return (
    <Modal open onClose={onClose} titleId="branch-selector-title" maxWidth={420}>
      <div style={{ padding:22 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:16 }}>
          <div>
            <span style={{ fontSize:11, fontWeight:700, color:'#C41E3A', letterSpacing:'.08em' }}>PILIH CABANG</span>
            <h3 id="branch-selector-title" style={{ fontFamily:'var(--font-display)', fontSize:24, lineHeight:1.1, fontWeight:700, color:'#1B3A6B', marginTop:3 }}>
              {product.name}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup modal" style={{ width:34, height:34, borderRadius:10, border:0, background:'#F3F0EB', color:'#6B7280', fontSize:17 }}>×</button>
        </div>
        <div className="mb-4 flex gap-2.5 rounded-xl border border-sr-navy/10 bg-sr-navy/[0.04] p-3 text-xs leading-5 text-sr-gray">
          <Store size={17} className="mt-0.5 shrink-0 text-sr-navy" aria-hidden="true" />
          <p>
          {loading
            ? 'Mencari cabang yang menyediakan produk ini...'
            : branches.length === 0
            ? 'Produk ini sedang tidak tersedia di cabang manapun'
            : <>Produk belum tersedia di <strong className="font-semibold text-sr-navy">{activeBranch?.name ?? 'cabang pilihanmu'}</strong>. Pilih cabang di bawah; produk akan langsung masuk ke keranjang.</>
          }
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs font-medium text-sr-gray">
            <LoaderCircle size={17} className="animate-spin" /> Memuat cabang...
          </div>
        ) : branches.length === 0 ? (
          <div style={{ textAlign:'center', padding:'20px 0', color:'#6B7280', fontSize:13 }}>
            😔 Mohon coba lagi nanti
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {branches.map(b => (
              <button key={b.id} onClick={() => handleSelect(b)} disabled={b.operational_status ? !b.operational_status.accepting_orders : false}
                style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 14px', opacity:b.operational_status && !b.operational_status.accepting_orders ? .65 : 1, border:'1.5px solid #EDD9B8', borderRadius:12, background:'#fff', cursor:b.operational_status && !b.operational_status.accepting_orders?'not-allowed':'pointer', textAlign:'left' }}>
                <span style={{ display:'grid', placeItems:'center', width:38, height:38, borderRadius:10, background:'rgba(27,58,107,.07)', color:'#1B3A6B', flexShrink:0 }}><MapPin size={17} /></span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1A1A2E' }}>{b.name}</div>
                  <div style={{ fontSize:11, color:'#6B7280' }}>{b.address}</div>
                  <p style={{ fontSize:11, color:b.operational_status?.code === 'open'?'#10B981':'#92600A', marginTop:2 }}>
                    {b.operational_status ? `${b.operational_status.label} · ${b.operational_status.message}` : '✓ Tersedia'}
                  </p>
                  {product.branch_prices?.[b.id] !== undefined && (
                    <p className="mt-1 text-[11px] font-bold text-sr-red">{formatRupiah(Number(product.branch_prices[b.id]))}</p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-sr-navy">Pilih <ArrowRight size={13} /></span>
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
