'use client'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import RegionSelect from '@/components/ui/RegionSelect'
import { useWilayahCascade, getCurrentPosition, reverseGeocode, type DetectLevel } from '@/hooks/useWilayahCascade'

const MapPicker = dynamic(() => import('@/components/checkout/MapPicker'), { ssr: false })

const S = {
  red:'#C41E3A', navy:'#1B3A6B',
  creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB',
  dark:'#1A1A2E', green:'#10B981',
}

interface Address {
  id: string
  label: string
  address: string
  detail?: string
  province_name?: string
  regency_name?: string
  district_name?: string
  village_name?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  is_default: boolean
}

function AddressCard({ addr, onEdit, onDelete, onDefault }: {
  addr: Address
  onEdit: () => void
  onDelete: () => void
  onDefault: () => void
}) {
  const icon = addr.label === 'Rumah' ? '🏠' : addr.label === 'Kantor' ? '🏢' : '📍'
  return (
    <div style={{
      border:`1.5px solid ${addr.is_default ? S.navy : S.creamDp}`,
      borderRadius:12, padding:16,
      background: addr.is_default ? 'rgba(27,58,107,0.03)' : '#fff',
    }}>
      <div className="account-address-head" style={{ marginBottom:8 }}>
        <div className="account-address-meta">
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ fontSize:13, fontWeight:700, color:S.dark }}>{addr.label}</span>
          {addr.is_default && (
            <span style={{ fontSize:10, background:'rgba(27,58,107,0.1)', color:S.navy, padding:'2px 8px', borderRadius:10, fontWeight:600 }}>
              Utama
            </span>
          )}
          {addr.latitude && <span style={{ fontSize:10, color:S.green }}>📌 GPS</span>}
        </div>
        <div className="account-address-actions">
          {!addr.is_default && (
            <button onClick={onDefault}
              style={{ fontSize:11, color:S.navy, background:'none', border:`1px solid ${S.creamDp}`, borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
              Jadikan Utama
            </button>
          )}
          <button onClick={onEdit}
            style={{ fontSize:11, color:S.gray, background:S.grayL, border:'none', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
            Edit
          </button>
          <button onClick={onDelete}
            style={{ fontSize:11, color:S.red, background:'rgba(196,30,58,0.06)', border:'none', borderRadius:6, padding:'3px 8px', cursor:'pointer' }}>
            Hapus
          </button>
        </div>
      </div>
      <p style={{ fontSize:13, color:S.dark, marginBottom:2 }}>{addr.address}</p>
      {addr.detail && <p style={{ fontSize:12, color:S.gray }}>{addr.detail}</p>}
      {(addr.district_name || addr.regency_name) && (
        <p style={{ fontSize:12, color:S.gray, marginTop:2 }}>
          {[addr.village_name, addr.district_name, addr.regency_name, addr.province_name].filter(Boolean).join(', ')}
          {addr.postal_code ? ` ${addr.postal_code}` : ''}
        </p>
      )}
    </div>
  )
}

function AddressForm({ initial, onSave, onCancel }: {
  initial?: Address
  onSave: (data: Partial<Address>) => void
  onCancel: () => void
}) {
  const [label,      setLabel]      = useState(initial?.label ?? 'Rumah')
  const [street,     setStreet]     = useState(initial?.address ?? '')
  const [detail,     setDetail]     = useState(initial?.detail ?? '')
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? '')
  const [lat,        setLat]        = useState<number | null>(initial?.latitude ?? null)
  const [lng,        setLng]        = useState<number | null>(initial?.longitude ?? null)
  const [showMap,    setShowMap]    = useState(false)
  const [detecting,  setDetecting]  = useState(false)

  const wilayah = useWilayahCascade()
  const { provinces, regencies, districts, villages, loadP, loadR, loadD, loadV,
    province, regency, district, village, onProvince, onRegency, onDistrict, onVillage } = wilayah

  // Muat daftar provinsi, lalu — kalau mode edit — cocokkan nama wilayah
  // yang sudah tersimpan (tanpa kode) ke Region asli agar dropdown pencarian
  // menampilkan pilihan yang tepat alih-alih kosong.
  useEffect(() => {
    let cancelled = false
    async function init() {
      await wilayah.loadProvinces()
      if (cancelled || !initial?.province_name) return
      await wilayah.resolveFromNames({
        province: initial.province_name,
        regency: initial.regency_name,
        district: initial.district_name,
        village: initial.village_name,
      })
    }
    void init()
    return () => { cancelled = true }
  }, [])

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

  async function onMapMove(newLat: number, newLng: number) {
    setLat(newLat); setLng(newLng)
    try {
      await detectAddress(newLat, newLng, false)
    } catch {
      toast.warning('Titik pin diperbarui, tetapi detail alamat belum terbaca.')
    }
  }

  function handleSave() {
    if (!street || !province || !regency || !district) {
      toast.error('Isi alamat, provinsi, kota, dan kecamatan'); return
    }
    onSave({
      label, address: street, detail: detail || undefined,
      latitude: lat ?? undefined, longitude: lng ?? undefined,
      province_name: province.name, regency_name: regency.name,
      district_name: district.name, village_name: village?.name,
      postal_code: postalCode || undefined,
    })
  }

  return (
    <div className="account-surface" style={{ background:S.grayL, marginTop:12 }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:S.dark, marginBottom:16 }}>
        {initial ? 'Edit Alamat' : 'Tambah Alamat Baru'}
      </h3>

      {/* Label */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6 }}>LABEL</label>
        <div style={{ display:'flex', gap:6 }}>
          {['Rumah','Kantor','Lainnya'].map(l => (
            <button key={l} onClick={() => setLabel(l)}
              style={{ padding:'7px 14px', borderRadius:8, fontSize:12, cursor:'pointer',
                border:`1.5px solid ${label===l ? S.red : S.creamDp}`,
                background: label===l ? 'rgba(196,30,58,0.08)' : '#fff',
                color: label===l ? S.red : S.gray, fontWeight: label===l ? 600 : 400 }}>
              {l==='Rumah'?'🏠 ':l==='Kantor'?'🏢 ':'📍 '}{l}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-detect button */}
      <button type="button" onClick={autoDetect} disabled={detecting}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 14px', border:`1.5px solid ${detecting?S.gray:S.navy}`, borderRadius:10, background:detecting?S.grayL:'rgba(27,58,107,0.05)', color:detecting?S.gray:S.navy, fontSize:13, fontWeight:500, cursor:detecting?'not-allowed':'pointer', marginBottom:14, transition:'all 0.2s' }}>
        {detecting
          ? <><span className="animate-spin" style={{ display:'inline-block' }}>⟳</span> Mendeteksi lokasi...</>
          : <><span>⌖</span> Gunakan Lokasi Saat Ini</>
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
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, marginBottom:14, fontSize:11, color:S.green }}>
          <span>✓ GPS: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
          <button onClick={() => setShowMap(true)} style={{ marginLeft:'auto', background:'none', border:'none', color:S.navy, fontSize:11, cursor:'pointer', fontWeight:600 }}>
            Lihat Peta
          </button>
        </div>
      )}

      {/* Wilayah dropdowns — searchable (react-select) */}
      {[
        { key:'province', label:'Provinsi *', val:province?.code??'', opts:provinces, loading:loadP, ph:'Cari Provinsi...', disabled:false, fn:onProvince },
        { key:'regency',  label:'Kota / Kabupaten *', val:regency?.code??'', opts:regencies, loading:loadR, ph:!province?'Pilih provinsi dulu':'Cari Kota/Kabupaten...', disabled:!province, fn:onRegency },
        { key:'district', label:'Kecamatan *', val:district?.code??'', opts:districts, loading:loadD, ph:!regency?'Pilih kota dulu':'Cari Kecamatan...', disabled:!regency, fn:onDistrict },
        { key:'village',  label:'Kelurahan / Desa', val:village?.code??'', opts:villages, loading:loadV, ph:!district?'Pilih kecamatan dulu':'Cari Kelurahan... (opsional)', disabled:!district, fn:onVillage },
      ].map(({ key, label:lb, val, opts, loading, ph, disabled, fn }) => (
        <div key={key} style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6 }}>{lb.toUpperCase()}</label>
          <RegionSelect name={key} value={val} onChange={fn} options={opts} placeholder={ph} loading={loading} disabled={disabled} />
        </div>
      ))}

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6 }}>NAMA JALAN & NOMOR *</label>
        <textarea className="c-input" style={{ resize:'none', height:72 }}
          placeholder="Jl. Sudirman No. 12, RT 03/RW 05"
          value={street} onChange={e => setStreet(e.target.value)} />
      </div>

      <div className="account-form-grid" style={{ marginBottom:16 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6 }}>PATOKAN / DETAIL</label>
          <input className="c-input" placeholder="Depan masjid, pagar biru..." value={detail} onChange={e => setDetail(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6 }}>KODE POS</label>
          <input className="c-input" placeholder="30113" maxLength={5} value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/g,''))} />
        </div>
      </div>

      <div className="account-actions">
        <button onClick={onCancel} className="c-btn c-btn-ghost c-btn-md" style={{ flex:1 }}>Batal</button>
        <button onClick={handleSave} disabled={!street||!province||!regency||!district}
          className="c-btn c-btn-primary c-btn-md" style={{ flex:2 }}>
          {initial ? 'Simpan Perubahan' : 'Tambah Alamat'}
        </button>
      </div>
    </div>
  )
}

export default function AddressesPage() {
  const { token } = useMemberStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing,  setEditing]    = useState<Address | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/member/addresses', { headers })
      setAddresses(Array.isArray(data) ? data : (data?.data ?? []))
    } catch { toast.error('Gagal memuat alamat') }
    finally { setLoading(false) }
  }

  // Initial request; `load` also owns refreshes after address mutations.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load() }, [])

  async function handleSave(formData: Partial<Address>) {
    try {
      if (editing) {
        await api.put(`/member/addresses/${editing.id}`, formData, { headers })
        toast.success('Alamat diperbarui!')
      } else {
        await api.post('/member/addresses', {
          ...formData,
          is_default: addresses.length === 0,
        }, { headers })
        toast.success('Alamat ditambahkan!')
      }
      setShowForm(false); setEditing(null)
      load()
    } catch { toast.error('Gagal menyimpan alamat') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus alamat ini?')) return
    try {
      await api.delete(`/member/addresses/${id}`, { headers })
      toast.success('Alamat dihapus')
      load()
    } catch { toast.error('Gagal menghapus') }
  }

  async function handleDefault(id: string) {
    try {
      await api.put(`/member/addresses/${id}`, { is_default: true }, { headers })
      toast.success('Alamat utama diperbarui')
      load()
    } catch { toast.error('Gagal mengatur alamat utama') }
  }

  return (
    <div>
      <header className="account-page-header">
        <div>
          <h1 className="account-page-title">Alamat Saya</h1>
          <p className="account-page-subtitle">Simpan alamat agar proses checkout lebih cepat.</p>
        </div>
        {!showForm && !editing && (
          <button onClick={() => { setShowForm(true); setEditing(null) }}
            className="c-btn c-btn-primary c-btn-md">
            + Tambah Alamat
          </button>
        )}
      </header>

      {/* Form tambah */}
      {showForm && !editing && (
        <AddressForm onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:12 }}>
        {loading ? (
          [1,2].map(i => <div key={i} className="c-shimmer" style={{ height:100, borderRadius:12 }} />)
        ) : addresses.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:S.gray }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
            <p style={{ fontSize:14, fontWeight:500 }}>Belum ada alamat tersimpan</p>
            <p style={{ fontSize:12, marginTop:4 }}>Tambahkan alamat untuk mempercepat checkout</p>
          </div>
        ) : addresses.map(addr => (
          <div key={addr.id}>
            {editing?.id === addr.id ? (
              <AddressForm
                initial={editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <AddressCard
                addr={addr}
                onEdit={() => { setEditing(addr); setShowForm(false) }}
                onDelete={() => handleDelete(addr.id)}
                onDefault={() => handleDefault(addr.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
