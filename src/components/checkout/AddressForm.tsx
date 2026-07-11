// src/components/checkout/AddressForm.tsx
'use client'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Member } from '@/types'
import RegionSelect from '@/components/ui/RegionSelect'
import { useWilayahCascade, getCurrentPosition, reverseGeocode, type DetectLevel } from '@/hooks/useWilayahCascade'

// Leaflet SSR fix — import dinamis
const MapPicker = dynamic(() => import('./MapPicker'), { ssr: false })

const S = {
  red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E',
  green:'#10B981', creamD:'#F5EDD9',
}

export interface AddressPayload {
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
interface Props { onSelect: (a: AddressPayload) => void; member: Member | null }

// ─── Main Component ───────────────────────────────────────
export default function AddressForm({ onSelect, member }: Props) {
  const token = useMemberStore(s => s.token)

  // Saved
  const [saved,     setSaved]     = useState<SavedAddress[]>([])
  const [selected,  setSelected]  = useState<string | null>(null)
  const [showNew,   setShowNew]   = useState(!member || !token)
  const [saving,    setSaving]    = useState(false)

  const wilayah = useWilayahCascade()
  const { provinces, regencies, districts, villages, loadP, loadR, loadD, loadV,
    province, regency, district, village, onProvince, onRegency, onDistrict, onVillage } = wilayah

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
    if (!member || !token) return
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
    if (!showNew) return
    void wilayah.loadProvinces()
  }, [showNew])

  async function detectAddress(latitude: number, longitude: number, showFeedback = true) {
    const geocoded = await reverseGeocode(latitude, longitude)
    const result = await wilayah.applyGeocoded(geocoded)
    if (result.street) setStreet(result.street)
    if (result.postalCode) setPostalCode(result.postalCode)

    if (!showFeedback) return
    showDetectToast(result.level)
  }

  function showDetectToast(level: DetectLevel) {
    if (level === 'village') {
      toast.success('Lokasi lengkap berhasil dideteksi', {
        description: 'Provinsi, kota, kecamatan, dan kelurahan sudah terisi. Periksa kembali titik pin.',
      })
    } else if (level === 'district') {
      toast.success('Kecamatan berhasil dideteksi', {
        description: 'Kelurahan belum cocok otomatis. Silakan pilih kelurahan secara manual.',
      })
    } else {
      toast.warning('Sebagian wilayah belum terdeteksi', {
        description: 'Titik GPS tersimpan. Lengkapi pilihan wilayah yang masih kosong.',
      })
    }
  }

  // ─── Auto-detect (OSM Nominatim) ─────────────────────────
  async function autoDetect() {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung deteksi lokasi.')
      return
    }
    setDetecting(true)
    try {
      const pos = await getCurrentPosition()
      const { latitude: lt, longitude: lg } = pos.coords
      setLat(lt); setLng(lg); setShowMap(true)
      try {
        await detectAddress(lt, lg)
      } catch {
        toast.warning('Titik GPS ditemukan, tetapi detail wilayah gagal dibaca.', {
          description: 'Geser pin bila perlu lalu lengkapi wilayah secara manual.',
        })
      }
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code
      if (code === 1) {
        toast.error('Izin lokasi ditolak', { description: 'Aktifkan izin lokasi untuk situs ini melalui pengaturan browser.' })
      } else {
        toast.error('Lokasi saat ini tidak dapat dideteksi.')
      }
    } finally {
      setDetecting(false)
    }
  }

  // Pin drag callback dari MapPicker
  async function onMapMove(newLat: number, newLng: number) {
    setLat(newLat); setLng(newLng)
    try {
      await detectAddress(newLat, newLng, false)
    } catch {
      toast.warning('Titik pin diperbarui, tetapi detail alamat belum terbaca.')
    }
  }

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
              {addr.is_default && <span style={{ fontSize:11, color:S.green, fontWeight:600 }}>✓ Default</span>}
              {addr.latitude  && <span style={{ fontSize:11, color:S.navy }}>📌 GPS</span>}
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
              : <><span>⌖</span> Gunakan Lokasi Saat Ini</>
            }
          </button>

          {lat && district && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              <div style={{ padding:'8px 10px', borderRadius:9, background:'rgba(16,185,129,.07)', border:'1px solid rgba(16,185,129,.16)' }}>
                <p style={{ fontSize:11, color:S.gray, marginBottom:2 }}>KECAMATAN</p>
                <p style={{ fontSize:11, fontWeight:700, color:S.green }}>{district.name}</p>
              </div>
              <div style={{ padding:'8px 10px', borderRadius:9, background:village?'rgba(16,185,129,.07)':'rgba(232,160,32,.08)', border:`1px solid ${village?'rgba(16,185,129,.16)':'rgba(232,160,32,.2)'}` }}>
                <p style={{ fontSize:11, color:S.gray, marginBottom:2 }}>KELURAHAN / DESA</p>
                <p style={{ fontSize:11, fontWeight:700, color:village?S.green:'#92600A' }}>{village?.name ?? 'Pilih manual'}</p>
              </div>
            </div>
          )}

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

          {/* Cascade dropdowns — searchable (react-select) */}
          {[
            { key:'province', label:'Provinsi *',          value:province?.code??'',  opts:provinces, loading:loadP, ph:'Cari Provinsi...',        disabled:false,      fn:onProvince },
            { key:'regency',  label:'Kota / Kabupaten *',  value:regency?.code??'',   opts:regencies, loading:loadR, ph:!province?'Pilih provinsi dulu':'Cari Kota/Kabupaten...', disabled:!province, fn:onRegency },
            { key:'district', label:'Kecamatan *',         value:district?.code??'',  opts:districts, loading:loadD, ph:!regency?'Pilih kota dulu':'Cari Kecamatan...',   disabled:!regency,  fn:onDistrict },
            { key:'village',  label:'Kelurahan / Desa',    value:village?.code??'',   opts:villages,  loading:loadV, ph:!district?'Pilih kecamatan dulu':'Cari Kelurahan... (opsional)', disabled:!district, fn:onVillage },
          ].map(({ key, label:lb, value, opts, loading, ph, disabled, fn }) => (
            <div key={key} style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:5, fontWeight:500 }}>{lb}</label>
              <RegionSelect name={key} value={value} onChange={fn} options={opts} placeholder={ph} loading={loading} disabled={disabled}/>
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
