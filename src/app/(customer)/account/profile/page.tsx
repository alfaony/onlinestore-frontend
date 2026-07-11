'use client'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'
import { useState } from 'react'
import { toast } from 'sonner'

const S = {
  red:'#C41E3A', navy:'#1B3A6B',
  creamDp:'#EDD9B8', gray:'#6B7280', grayL:'#F3F0EB',
  dark:'#1A1A2E', green:'#10B981',
}

export default function ProfilePage() {
  const { member, token, setMember } = useMemberStore()

  const [name,    setName]    = useState(member?.name ?? '')
  const [email,   setEmail]   = useState(member?.email ?? '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function handleSave() {
    if (!name.trim()) { toast.error('Nama tidak boleh kosong'); return }
    setSaving(true); setSaved(false)
    try {
      const { data } = await api.put('/member/profile',
        { name, email: email || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setMember(data, token!)
      setSaved(true)
      toast.success('Profil berhasil disimpan!')
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error('Gagal menyimpan profil')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <header className="account-page-header">
        <div>
          <h1 className="account-page-title">Profil Saya</h1>
          <p className="account-page-subtitle">Kelola identitas dan informasi kontak akunmu.</p>
        </div>
      </header>

      <div className="account-surface">

        {/* Avatar */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:28, paddingBottom:24, borderBottom:`1px solid ${S.grayL}` }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg, ${S.navy}, ${S.red})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, color:'#fff', fontWeight:700, flexShrink:0 }}>
            {(name || member?.phone || '?')[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize:16, fontWeight:700, color:S.dark }}>{name || 'Member'}</p>
            <p style={{ fontSize:13, color:S.gray, marginTop:3 }}>+{member?.phone}</p>
            {member?.is_verified && (
              <span style={{ fontSize:11, color:S.green, fontWeight:600 }}>✓ Terverifikasi</span>
            )}
          </div>
        </div>

        {/* Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
              Nomor WhatsApp
            </label>
            <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${S.grayL}`, borderRadius:10, padding:'11px 14px', background:S.grayL }}>
              <span style={{ fontSize:13, color:S.gray }}>+{member?.phone}</span>
              <span style={{ marginLeft:'auto', fontSize:10, color:S.green, fontWeight:600 }}>✓ Terverifikasi</span>
            </div>
            <p style={{ fontSize:11, color:S.gray, marginTop:4 }}>Nomor WhatsApp tidak bisa diubah</p>
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
              Nama Lengkap *
            </label>
            <input
              className="c-input"
              placeholder="Nama lengkap kamu"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize:11, fontWeight:700, color:S.gray, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
              Email <span style={{ fontWeight:400, textTransform:'none' }}>(opsional)</span>
            </label>
            <input
              className="c-input"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <p style={{ fontSize:11, color:S.gray, marginTop:4 }}>Untuk menerima invoice pesanan</p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="c-btn c-btn-primary c-btn-md"
            style={{ alignSelf:'flex-start', minWidth:160 }}>
            {saving ? '⟳ Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}
