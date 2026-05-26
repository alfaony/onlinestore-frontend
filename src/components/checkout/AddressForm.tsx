// src/components/checkout/AddressForm.tsx
'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'

const S = {
  red: '#C41E3A', navy: '#1B3A6B', creamDp: '#EDD9B8',
  gray: '#6B7280', grayL: '#F3F0EB', dark: '#1A1A2E',
  green: '#10B981', creamD: '#F5EDD9',
}

interface SavedAddress {
  id: string
  label: string
  address: string
  detail?: string
  city?: string
  province?: string
  postal_code?: string
  is_default: boolean
}

interface AddressPayload {
  label: string
  address: string
  detail?: string
  city: string
  province: string
  postal_code: string
}

interface Props {
  onSelect: (a: AddressPayload) => void
  member: any
}

export default function AddressForm({ onSelect, member }: Props) {
  const token = useMemberStore(s => s.token)

  const [saved, setSaved] = useState<SavedAddress[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [label, setLabel] = useState('Rumah')
  const [address, setAddress] = useState('')
  const [detail, setDetail] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')

  // Load saved addresses
  useEffect(() => {
    if (!member || !token) { setShowNew(true); return }
    api.get('/member/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        setSaved(list)
        const def = list.find((a: SavedAddress) => a.is_default)
        if (def) { setSelected(def.id); onSelect(def) }
        else if (!list.length) setShowNew(true)
      })
      .catch(() => setShowNew(true))
  }, [])

  function selectSaved(addr: SavedAddress) {
    setSelected(addr.id)
    // onSelect(address)
    setShowNew(false)
  }

  // src/components/checkout/AddressForm.tsx
  // Hapus city, province, postal_code dari form
  // Ganti dengan field 'detail' yang lebih lengkap

  async function handleSave() {
    if (!address) {
      toast.error('Isi alamat lengkap')
      return
    }

    const payload = {
      label,
      address,
      detail,        // pakai detail untuk patokan, kota, dll
      is_default: saved.length === 0,
    }

    if (member && token) {
      setSaving(true)
      try {
        const { data } = await api.post('/member/addresses', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSaved(prev => [...prev, data])
        selectSaved(data)
        toast.success('Alamat disimpan!')
      } catch {
        toast.error('Gagal menyimpan alamat.')
      } finally { setSaving(false) }
    } else {
      onSelect(payload)
      setShowNew(false)
    }
  }

  const LABELS = ['Rumah', 'Kantor', 'Lainnya']
  const PROVINCES = [
    'Sumatera Selatan', 'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah',
    'Jawa Timur', 'Banten', 'DI Yogyakarta', 'Bali', 'Sumatera Utara',
    'Kalimantan Timur', 'Sulawesi Selatan', 'Lainnya',
  ]

  return (
    <div style={{ marginBottom: 20 }}>

      {/* Saved addresses */}
      {saved.map(addr => (
        <label key={addr.id} onClick={() => selectSaved(addr)}
          style={{ display: 'flex', alignItems: 'start', gap: 12, padding: '12px 14px', border: `1.5px solid ${selected === addr.id ? S.red : S.creamDp}`, borderRadius: 10, cursor: 'pointer', background: selected === addr.id ? 'rgba(196,30,58,0.04)' : '#fff', marginBottom: 8, transition: 'all 0.18s' }}>
          <input type="radio" readOnly checked={selected === addr.id} style={{ marginTop: 3, accentColor: S.red }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 16 }}>{addr.label === 'Rumah' ? '🏠' : addr.label === 'Kantor' ? '🏢' : '📍'}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: S.dark }}>{addr.label}</span>
              {addr.is_default && <span style={{ fontSize: 10, color: S.green, fontWeight: 600 }}>✓ Default</span>}
            </div>
            <p style={{ fontSize: 12, color: S.gray }}>{addr.address}</p>
            {addr.detail && <p style={{ fontSize: 11, color: S.gray }}>{addr.detail}</p>}
            <p style={{ fontSize: 11, color: S.gray, marginTop: 2 }}>{addr.city}, {addr.province} {addr.postal_code}</p>
          </div>
        </label>
      ))}

      {/* New address form */}
      {showNew ? (
        <div style={{ border: `1.5px dashed ${S.creamDp}`, borderRadius: 12, padding: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.dark, marginBottom: 14 }}>
            {saved.length > 0 ? '+ Alamat Baru' : 'Masukkan Alamat Pengiriman'}
          </p>

          {/* Label */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 6, fontWeight: 500 }}>Label</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {LABELS.map(l => (
                <button key={l} type="button" onClick={() => setLabel(l)}
                  style={{ padding: '6px 12px', borderRadius: 7, border: `1.5px solid ${label === l ? S.red : S.creamDp}`, background: label === l ? 'rgba(196,30,58,0.08)' : 'transparent', color: label === l ? S.red : S.gray, fontSize: 12, cursor: 'pointer' }}>
                  {l === 'Rumah' ? '🏠 ' : l === 'Kantor' ? '🏢 ' : '📍 '}{l}
                </button>
              ))}
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>
              Alamat Lengkap <span style={{ color: S.red }}>*</span>
            </label>
            <textarea
              className="c-input"
              style={{ resize: 'none', height: 72 }}
              placeholder="Nama jalan, nomor rumah, RT/RW..."
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Detail (opsional)</label>
            <input className="c-input" placeholder="Patokan, gedung, lantai..." value={detail} onChange={e => setDetail(e.target.value)} />
          </div>

          {/* City + Province */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>
                Kota / Kabupaten <span style={{ color: S.red }}>*</span>
              </label>
              <input className="c-input" placeholder="Contoh: Palembang" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>
                Provinsi <span style={{ color: S.red }}>*</span>
              </label>
              <select className="c-input" value={province} onChange={e => setProvince(e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">Pilih Provinsi</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Kode Pos</label>
            <input className="c-input" placeholder="Contoh: 30111" maxLength={5} value={postalCode} onChange={e => setPostalCode(e.target.value.replace(/\D/, ''))} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {saved.length > 0 && (
              <button type="button" onClick={() => setShowNew(false)} className="c-btn c-btn-ghost c-btn-md" style={{ flex: 1 }}>Batal</button>
            )}
            <button type="button" onClick={handleSave} disabled={saving || !address || !city || !province}
              className="c-btn c-btn-primary c-btn-md" style={{ flex: 2 }}>
              {saving ? 'Menyimpan...' : 'Gunakan Alamat Ini'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowNew(true)}
          style={{ background: 'none', border: 'none', color: S.red, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          + Tambah Alamat Baru
        </button>
      )}
    </div>
  )
}