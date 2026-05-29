// src/components/checkout/AddressForm.tsx
'use client'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

// Leaflet SSR fix — import dinamis
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

const NOMINATIM = 'https://nominatim.openstreetmap.org/reverse'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E',
  green:'#10B981', creamD:'#F5EDD9',
}

// ─── Types ────────────────────────────────────────────────
interface Region { code: string; name: string }

interface AddressPayload {
  label: string; address: string; detail?: string
  latitude?: number; longitude?: number
  province_code?: string; province_name?: string
  regency_code?: string;  regency_name?: string
  district_code?: string; district_name?: string
  village_code?: string;  village_name?: string
  postal_code?: string;   city?: string
  is_default?: boolean
}

interface SavedAddress extends AddressPayload { id: string; is_default: boolean }
interface Props { onSelect: (a: AddressPayload) => void; member: any }

// ─── Helpers ──────────────────────────────────────────────
async function fetchWilayah(path: string): Promise<Region[]> {
  try {
    const res = await fetch(`/api/wilayah/${path}`)
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

async function reverseGeocode(lat: number, lng: number) {
  const res  = await fetch(
    `${NOMINATIM}?format=json&lat=${lat}&lon=${lng}&accept-language=id&addressdetails=1`,
    { headers: { 'User-Agent': 'SerasoPalembang/1.0' } }
  )
  return res.json()
}

function normalize(str: string) {
  return str.toLowerCase()
    .replace(/^(provinsi|kota|kabupaten|kab\.)\s*/i, '')
    .trim()
}

function matchRegion(list: Region[], query: string): Region | null {
  if (!query) return null
  const q = normalize(query)
  return list.find(r => normalize(r.name).includes(q) || q.includes(normalize(r.name))) ?? null
}

// ─── Select Component ─────────────────────────────────────
function RegionSelect({ value, onChange, options, placeholder, loading, disabled }: {
  value: string; onChange: (v: string) => void
  options: Region[]; placeholder: string
  loading?: boolean; disabled?: boolean
}) {
  return (
    <div style={{ position:'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        disabled={loading || disabled || options.length === 0}
        className="c-input"
        style={{ cursor: (loading||disabled||!options.length) ? 'not-allowed' : 'pointer', color: value ? S.dark : S.gray }}>
        <option value="">{loading ? 'Memuat...' : placeholder}</option>
        {options.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
      </select>
      {loading && (
        <span className="animate-spin" style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:14, display:'inline-block' }}>
          ⟳
        </span>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────
export default function AddressForm({ onSelect, member }: Props) {
  const token = useMemberStore(s => s.token)

  // Saved
  const [saved,     setSaved]     = useState<SavedAddress[]>([])
  const [selected,  setSelected]  = useState<string | null>(null)
  const [showNew,   setShowNew]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  // Wilayah cascade
  const [provinces, setProvinces] = useState<Region[]>([])
  const [regencies, setRegencies] = useState<Region[]>([])
  const [districts, setDistricts] = useState<Region[]>([])
  const [villages,  setVillages]  = useState<Region[]>([])
  const [loadP, setLoadP] = useState(false)
  const [loadR, setLoadR] = useState(false)
  const [loadD, setLoadD] = useState(false)
  const [loadV, setLoadV] = useState(false)

  // Selected region objects
  const [province, setProvince] = useState<Region | null>(null)
  const [regency,  setRegency]  = useState<Region | null>(null)
  const [district, setDistrict] = useState<Region | null>(null)
  const [village,  setVillage]  = useState<Region | null>(null)

  // Form fields
  const [label,      setLabel]      = useState('Rumah')
  const [street,     setStreet]     = useState('')
  const [detail,     setDetail]     = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [lat,        setLat]        = useState<number | null>(null)
  const [lng,        setLng]        = useState<number | null>(null)
  const [showMap,    setShowMap]    = useState(false)
  const [detecting,  setDetecting]  = useState(false)

  // Load saved
  useEffect(() => {
    if (!member || !token) { setShowNew(true); return }
    api.get('/member/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const list: SavedAddress[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        setSaved(list)
        const def = list.find(a => a.is_default)
        if (def) { setSelected(def.id); onSelect(def) }
        else if (!list.length) setShowNew(true)
      })
      .catch(() => setShowNew(true))
  }, [])

  // Load provinces when form opens
  useEffect(() => {
    if (!showNew || provinces.length) return
    setLoadP(true)
    fetchWilayah('provinces')
      .then(setProvinces)
      .finally(() => setLoadP(false))
  }, [showNew])

  // Cascade handlers
  async function onProvince(code: string) {
    const p = provinces.find(x => x.code === code) ?? null
    setProvince(p); setRegency(null); setDistrict(null); setVillage(null)
    setRegencies([]); setDistricts([]); setVillages([])
    if (!code) return
    setLoadR(true)
    fetchWilayah(`regencies/${code}`).then(setRegencies).finally(() => setLoadR(false))
  }

  async function onRegency(code: string) {
    const r = regencies.find(x => x.code === code) ?? null
    setRegency(r); setDistrict(null); setVillage(null)
    setDistricts([]); setVillages([])
    if (!code) return
    setLoadD(true)
    fetchWilayah(`districts/${code}`).then(setDistricts).finally(() => setLoadD(false))
  }

  async function onDistrict(code: string) {
    const d = districts.find(x => x.code === code) ?? null
    setDistrict(d); setVillage(null); setVillages([])
    if (!code) return
    setLoadV(true)
    fetchWilayah(`villages/${code}`).then(setVillages).finally(() => setLoadV(false))
  }

  function onVillage(code: string) {
    setVillage(villages.find(x => x.code === code) ?? null)
  }

  // ─── Auto-detect (OSM Nominatim) ─────────────────────────
  async function autoDetect() {
    if (!navigator.geolocation) { toast.error('Browser tidak support geolocation'); return }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lt, longitude: lg } = pos.coords
        setLat(lt); setLng(lg); setShowMap(true)
        try {
          const geo  = await reverseGeocode(lt, lg)
          const addr = geo?.address ?? {}

          // Auto-fill street & postal code dari Nominatim
          const road = [addr.road, addr.house_number].filter(Boolean).join(' ')
          if (road && !street) setStreet(road)
          if (addr.postcode)   setPostalCode(addr.postcode)

          // Parse region dari Nominatim
          const provQuery = addr.state ?? ''
          const regQuery  = addr.city ?? addr.county ?? ''
          const distQuery = addr.suburb ?? addr.village ?? addr.town ?? ''
          const vilQuery  = addr.neighbourhood ?? addr.hamlet ?? ''

          // Load & match province
          let provs = provinces
          if (!provs.length) {
            setLoadP(true)
            provs = await fetchWilayah('provinces')
            setProvinces(provs)
            setLoadP(false)
          }
          const matchedProv = matchRegion(provs, provQuery)
          if (!matchedProv) { toast.warning('Provinsi tidak terdeteksi, pilih manual'); setDetecting(false); return }
          setProvince(matchedProv)

          // Load & match regency
          setLoadR(true)
          const regs = await fetchWilayah(`regencies/${matchedProv.code}`)
          setRegencies(regs); setLoadR(false)
          const matchedReg = matchRegion(regs, regQuery)
          if (matchedReg) {
            setRegency(matchedReg)
            // Load & match district
            setLoadD(true)
            const dists = await fetchWilayah(`districts/${matchedReg.code}`)

            setDistricts(dists); setLoadD(false)
            const matchedDist = matchRegion(dists, distQuery)
            if (matchedDist) {
              setDistrict(matchedDist)
              // Load & match village
              setLoadV(true)
              const vils = await fetchWilayah(`villages/${matchedDist.code}`)
              setVillages(vils); setLoadV(false)
              const matchedVil = matchRegion(vils, vilQuery)
              if (matchedVil) setVillage(matchedVil)
            }
          }
          toast.success('Lokasi terdeteksi! Periksa dan koreksi jika perlu.')
        } catch {
          toast.warning('Lokasi terdeteksi, tapi gagal auto-fill. Isi manual.')
        } finally { setDetecting(false) }
      },
      err => {
        setDetecting(false)
        if (err.code === 1) toast.error('Izin lokasi ditolak. Aktifkan di browser.')
        else toast.error('Gagal deteksi lokasi.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Pin drag callback dari MapPicker
  const onMapMove = useCallback(async (newLat: number, newLng: number) => {
    setLat(newLat); setLng(newLng)
    try {
      const geo  = await reverseGeocode(newLat, newLng)
      const addr = geo?.address ?? {}
      const road = [addr.road, addr.house_number].filter(Boolean).join(' ')
      if (road) setStreet(road)
      if (addr.postcode) setPostalCode(addr.postcode)
    } catch {}
  }, [])

  // ─── Save ─────────────────────────────────────────────────
  async function handleSave() {
    if (!street || !province || !regency || !district) {
      toast.error('Lengkapi alamat, provinsi, kota, dan kecamatan'); return
    }
    const payload: AddressPayload = {
      label, address: street, detail,
      latitude: lat ?? undefined, longitude: lng ?? undefined,
      province_code: province.code, province_name: province.name,
      regency_code:  regency.code,  regency_name:  regency.name,
      district_code: district.code, district_name: district.name,
      village_code:  village?.code, village_name:  village?.name,
      postal_code: postalCode, city: regency.name,
      is_default: saved.length === 0,
    }
    if (member && token) {
      setSaving(true)
      try {
        const { data } = await api.post('/member/addresses', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSaved(p => [...p, data])
        setSelected(data.id); onSelect(data); setShowNew(false)
        toast.success('Alamat disimpan!')
      } catch { toast.error('Gagal menyimpan alamat.')
      } finally { setSaving(false) }
    } else {
      onSelect(payload); setShowNew(false)
    }
  }

  function selectSaved(addr: SavedAddress) {
    setSelected(addr.id); onSelect(addr); setShowNew(false)
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div style={{ marginBottom:20 }}>

      {/* Saved addresses */}
      {saved.map(addr => (
        <label key={addr.id} onClick={() => selectSaved(addr)}
          style={{ display:'flex', alignItems:'start', gap:12, padding:'12px 14px', border:`1.5px solid ${selected===addr.id?S.red:S.creamDp}`, borderRadius:10, cursor:'pointer', background:selected===addr.id?'rgba(196,30,58,0.04)':'#fff', marginBottom:8, transition:'all 0.18s' }}>
          <input type="radio" readOnly checked={selected===addr.id} style={{ marginTop:3, accentColor:S.red }}/>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
              <span>{addr.label==='Rumah'?'🏠':addr.label==='Kantor'?'🏢':'📍'}</span>
              <span style={{ fontSize:13, fontWeight:600, color:S.dark }}>{addr.label}</span>
              {addr.is_default && <span style={{ fontSize:10, color:S.green, fontWeight:600 }}>✓ Default</span>}
              {addr.latitude  && <span style={{ fontSize:10, color:S.navy }}>📌 GPS</span>}
            </div>
            <p style={{ fontSize:12, color:S.gray }}>{addr.address}</p>
            {addr.district_name && (
              <p style={{ fontSize:11, color:S.gray }}>
                {[addr.village_name, addr.district_name, addr.regency_name].filter(Boolean).join(', ')}
              </p>
            )}
            {addr.province_name && (
              <p style={{ fontSize:11, color:S.gray }}>
                {addr.province_name}{addr.postal_code ? ` · ${addr.postal_code}` : ''}
              </p>
            )}
          </div>
        </label>
      ))}

      {/* New form */}
      {showNew ? (
        <div style={{ border:`1.5px dashed ${S.creamDp}`, borderRadius:12, padding:16 }}>
          <p style={{ fontSize:13, fontWeight:600, color:S.dark, marginBottom:14 }}>
            {saved.length > 0 ? '+ Tambah Alamat Baru' : 'Masukkan Alamat Pengiriman'}
          </p>

          {/* Label */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:6, fontWeight:500 }}>Label</label>
            <div style={{ display:'flex', gap:6 }}>
              {['Rumah','Kantor','Lainnya'].map(l => (
                <button key={l} type="button" onClick={() => setLabel(l)}
                  style={{ padding:'6px 12px', borderRadius:7, border:`1.5px solid ${label===l?S.red:S.creamDp}`, background:label===l?'rgba(196,30,58,0.08)':'transparent', color:label===l?S.red:S.gray, fontSize:12, cursor:'pointer' }}>
                  {l==='Rumah'?'🏠 ':l==='Kantor'?'🏢 ':'📍 '}{l}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-detect button */}
          <button type="button" onClick={autoDetect} disabled={detecting}
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 14px', border:`1.5px solid ${detecting?S.gray:S.navy}`, borderRadius:10, background:detecting?S.grayL:'rgba(27,58,107,0.05)', color:detecting?S.gray:S.navy, fontSize:13, fontWeight:500, cursor:detecting?'not-allowed':'pointer', marginBottom:12, transition:'all 0.2s' }}>
            {detecting
              ? <><span className="animate-spin" style={{ display:'inline-block' }}>⟳</span> Mendeteksi lokasi...</>
              : <><span>📍</span> Deteksi Lokasi Otomatis (OpenStreetMap)</>
            }
          </button>

          {/* Leaflet Map Preview */}
          {showMap && lat && lng && (
            <div style={{ marginBottom:14, borderRadius:10, overflow:'hidden', border:`1px solid ${S.creamDp}` }}>
              <div style={{ padding:'6px 10px', background:'rgba(27,58,107,0.05)', fontSize:11, color:S.navy, display:'flex', alignItems:'center', gap:6 }}>
                🗺️ Drag pin untuk koreksi lokasi
                <button onClick={() => setShowMap(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:S.gray, cursor:'pointer', fontSize:14 }}>✕</button>
              </div>
              <MapPicker lat={lat} lng={lng} onMove={onMapMove}/>
            </div>
          )}

          {lat && lng && !showMap && (
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, marginBottom:12, fontSize:11, color:S.green }}>
              <span>✓ GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
              <button onClick={() => setShowMap(true)} style={{ marginLeft:'auto', background:'none', border:'none', color:S.navy, fontSize:11, cursor:'pointer', fontWeight:600 }}>
                Lihat Peta
              </button>
            </div>
          )}

          {/* Cascade dropdowns */}
          {[
            { label:'Provinsi *',          value:province?.code??'',  opts:provinces, loading:loadP, ph:'Pilih Provinsi',        disabled:false,      fn:onProvince },
            { label:'Kota / Kabupaten *',  value:regency?.code??'',   opts:regencies, loading:loadR, ph:!province?'Pilih provinsi dulu':'Pilih Kota/Kabupaten', disabled:!province, fn:onRegency },
            { label:'Kecamatan *',         value:district?.code??'',  opts:districts, loading:loadD, ph:!regency?'Pilih kota dulu':'Pilih Kecamatan',   disabled:!regency,  fn:onDistrict },
            { label:'Kelurahan / Desa',    value:village?.code??'',   opts:villages,  loading:loadV, ph:!district?'Pilih kecamatan dulu':'Pilih Kelurahan (opsional)', disabled:!district, fn:onVillage },
          ].map(({ label:lb, value, opts, loading, ph, disabled, fn }) => (
            <div key={lb} style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>{lb}</label>
              <RegionSelect value={value} onChange={fn} options={opts} placeholder={ph} loading={loading} disabled={disabled}/>
            </div>
          ))}

          {/* Street */}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>
              Nama Jalan & Nomor <span style={{ color:S.red }}>*</span>
            </label>
            <textarea className="c-input" style={{ resize:'none', height:72 }}
              placeholder="Contoh: Jl. Sudirman No. 12, RT 03/RW 05"
              value={street} onChange={e => setStreet(e.target.value)}/>
          </div>

          {/* Detail */}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>Patokan / Detail</label>
            <input className="c-input" placeholder="Contoh: Depan masjid, pagar biru" value={detail} onChange={e => setDetail(e.target.value)}/>
          </div>

          {/* Postal code */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>Kode Pos</label>
            <input className="c-input" placeholder="Contoh: 30113" maxLength={5}
              value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g,''))}/>
          </div>

          {/* Actions */}
          <div style={{ display:'flex', gap:8 }}>
            {saved.length > 0 && (
              <button type="button" onClick={() => setShowNew(false)} className="c-btn c-btn-ghost c-btn-md" style={{ flex:1 }}>Batal</button>
            )}
            <button type="button" onClick={handleSave}
              disabled={saving || !street || !province || !regency || !district}
              className="c-btn c-btn-primary c-btn-md" style={{ flex:2 }}>
              {saving ? 'Menyimpan...' : 'Gunakan Alamat Ini'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowNew(true)}
          style={{ background:'none', border:'none', color:S.red, fontSize:13, fontWeight:600, cursor:'pointer', marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
          + Tambah Alamat Baru
        </button>
      )}
    </div>
  )
}