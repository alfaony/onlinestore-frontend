// src/components/home/BranchSelector.tsx
'use client'
import api from '@/lib/api'
import { useCartStore } from '@/stores/cart.store'
import type { Branch } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, LoaderCircle, LocateFixed, MapPin, Store } from 'lucide-react'

interface BranchWithDistance extends Branch {
  distance?: number
  hours?: string
}

export default function BranchSelector() {
  const router  = useRouter()
  const [branches,  setBranches]  = useState<BranchWithDistance[]>([])
  const [loading,   setLoading]   = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [userLat,   setUserLat]   = useState<number|null>(null)
  const [cityName,  setCityName]  = useState('')

  const setActiveBranch = useCartStore(s => s.setActiveBranch)
  const setSwitchingBranch = useCartStore(s => s.setSwitchingBranch)

  async function fetchBranches(lat?: number, lng?: number) {
    setLoading(true)
    try {
      const params: Record<string, number> = {}
      if (lat !== undefined && lng !== undefined) { params.lat = lat; params.lng = lng }
      const { data } = await api.get('/branches', { params })
      setBranches(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get('/branches')
      .then(({ data }) => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]))
      .finally(() => setLoading(false))
  }, [])

  async function detectLocation() {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserLat(lat)

        // Reverse geocode untuk nama kota
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`,
            { headers: { 'User-Agent': 'SerasoPalembang/1.0' } }
          )
          const geo = await res.json()
          const city = geo.address?.city
            ?? geo.address?.county
            ?? geo.address?.state
            ?? ''
          setCityName(city)
        } catch {}

        await fetchBranches(lat, lng)
        setDetecting(false)
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function handleSelect(branch: BranchWithDistance) {
    setActiveBranch({ id: branch.id, name: branch.name })
    setSwitchingBranch(true)
    router.push(`/menu?branch_id=${branch.id}`)
  }

  function formatDistance(km?: number) {
    if (!km || km === 9999) return null
    return km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`
  }

  return (
    <div>
      {/* Detect location button */}
      <button
        onClick={detectLocation}
        disabled={detecting}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:9, width:'100%', margin:'0 auto 18px', padding:'13px 20px', border:'1px solid rgba(255,255,255,0.24)', borderRadius:12, background:'rgba(255,255,255,0.1)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.2s' }}>
        {detecting
          ? <><LoaderCircle size={17} className="animate-spin" /> Mendeteksi lokasi...</>
          : <><LocateFixed size={17} /> Gunakan lokasi saat ini</>
        }
      </button>

      {/* City name */}
      {cityName && (
        <p style={{ textAlign:'center', color:'rgba(255,255,255,0.6)', fontSize:13, marginBottom:16 }}>
          Lokasi kamu: <strong style={{ color:'#F5C55A' }}>{cityName}</strong>
        </p>
      )}

      {/* Branch list */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2].map(i => (
            <div key={i} className="c-shimmer" style={{ height:90, borderRadius:12 }}/>
          ))}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {branches.map((b, i) => {
            const dist  = formatDistance(b.distance)
            const isNear = (b.distance ?? 9999) < 50
            const operational = b.operational_status
            const unavailable = operational ? !operational.accepting_orders : false
            const statusColor = operational?.code === 'open' ? '#6ee7b7'
              : operational?.code === 'closing_soon' ? '#F5C55A'
              : '#fca5a5'

            return (
              <button key={b.id} onClick={() => handleSelect(b)} disabled={unavailable}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', opacity:unavailable ? .68 : 1, background: i===0&&userLat ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.075)', border: i===0&&userLat ? '1px solid rgba(245,197,90,.55)' : '1px solid rgba(255,255,255,0.13)', borderRadius:14, cursor:unavailable?'not-allowed':'pointer', textAlign:'left', width:'100%', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = i===0&&userLat ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}>

                {/* Icon */}
                <div style={{ width:44, height:44, background:'rgba(232,160,32,0.18)', color:'#F5C55A', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Store size={20} />
                </div>

                {/* Info */}
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{b.name}</span>
                    {i===0 && userLat && isNear && (
                      <span style={{ fontSize:11, background:'rgba(16,185,129,0.3)', color:'#6ee7b7', padding:'2px 8px', borderRadius:10, fontWeight:600 }}>
                        Terdekat
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-1" style={{ fontSize:11, color:'rgba(255,255,255,0.52)', marginBottom:3 }}>{b.address}</p>
                  {dist && <p style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#F5C55A' }}><MapPin size={10} /> {dist} dari lokasimu</p>}
                  {operational && (
                    <p style={{ fontSize:11, color:statusColor, marginTop:3, lineHeight:1.4 }}>
                      <strong>{operational.label}</strong> · {operational.message}
                    </p>
                  )}
                </div>

                <ArrowRight size={17} color="rgba(255,255,255,.55)" />
              </button>
            )
          })}
          {branches.length === 0 && (
            <div style={{ padding:'22px 16px', border:'1px dashed rgba(255,255,255,.2)', borderRadius:14, textAlign:'center', color:'rgba(255,255,255,.58)', fontSize:12 }}>
              Cabang belum dapat dimuat. Kamu tetap bisa melihat seluruh menu.
            </div>
          )}
        </div>
      )}

      {/* Atau lihat semua menu */}
      <button onClick={() => router.push('/menu')}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', textAlign:'center', marginTop:14, padding:8, background:'transparent', border:'none', color:'rgba(255,255,255,0.58)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
        Lihat semua menu <ArrowRight size={13} />
      </button>
    </div>
  )
}
