'use client'
import { useEffect, useState } from 'react'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E', green:'#10B981',
}

interface Branch {
  id: string
  name: string
  address: string
  phone?: string
}

interface Props {
  branch: Branch
  onSelect: (datetime: string, note: string) => void
}

// Generate slot waktu — hari ini + 2 hari kedepan, jam 10-20
function generateSlots() {
  const slots: { date: string; label: string; times: string[] }[] = []
  const now = new Date()

  for (let d = 0; d < 3; d++) {
    const date = new Date(now)
    date.setDate(now.getDate() + d)

    const dateStr = date.toISOString().split('T')[0]
    const label = d === 0 ? 'Hari Ini' : d === 1 ? 'Besok' : date.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'short' })

    const times: string[] = []
    const startHour = d === 0 ? Math.max(now.getHours() + 1, 10) : 10
    for (let h = startHour; h <= 20; h++) {
      times.push(`${String(h).padStart(2,'0')}:00`)
    }

    if (times.length > 0) slots.push({ date: dateStr, label, times })
  }

  return slots
}

export default function PickupScheduler({ branch, onSelect }: Props) {
  const [slots] = useState(generateSlots())
  const [selectedDate, setSelectedDate] = useState(slots[0]?.date ?? '')
  const [selectedTime, setSelectedTime] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (selectedDate && selectedTime) {
      onSelect(`${selectedDate} ${selectedTime}:00`, note)
    }
  }, [selectedDate, selectedTime, note])

  const currentSlot = slots.find(s => s.date === selectedDate)

  return (
    <div>
      {/* Info cabang */}
      <div style={{ background:'rgba(27,58,107,0.05)', border:'1px solid rgba(27,58,107,0.15)', borderRadius:12, padding:14, marginBottom:16 }}>
        <p style={{ fontSize:13, fontWeight:600, color:S.navy, marginBottom:4 }}>📍 {branch.name}</p>
        <p style={{ fontSize:12, color:S.gray }}>{branch.address}</p>
        {branch.phone && <p style={{ fontSize:12, color:S.gray, marginTop:2 }}>📞 {branch.phone}</p>}
      </div>

      {/* Pilih tanggal */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:8, fontWeight:500 }}>
          Pilih Tanggal Ambil
        </label>
        <div style={{ display:'flex', gap:8 }}>
          {slots.map(s => (
            <button key={s.date} onClick={() => { setSelectedDate(s.date); setSelectedTime('') }}
              style={{
                flex:1, padding:'10px 8px', borderRadius:10,
                border:`1.5px solid ${selectedDate===s.date ? S.red : S.creamDp}`,
                background: selectedDate===s.date ? 'rgba(196,30,58,0.06)' : '#fff',
                color: selectedDate===s.date ? S.red : S.dark,
                fontSize:12, fontWeight:600, cursor:'pointer', textAlign:'center',
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pilih jam */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:8, fontWeight:500 }}>
          Pilih Jam
        </label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {currentSlot?.times.map(t => (
            <button key={t} onClick={() => setSelectedTime(t)}
              style={{
                padding:'8px 14px', borderRadius:8,
                border:`1.5px solid ${selectedTime===t ? S.red : S.creamDp}`,
                background: selectedTime===t ? 'rgba(196,30,58,0.06)' : '#fff',
                color: selectedTime===t ? S.red : S.dark,
                fontSize:12, fontWeight:500, cursor:'pointer',
              }}>
              {t}
            </button>
          ))}
          {currentSlot?.times.length === 0 && (
            <p style={{ fontSize:12, color:S.gray }}>Tidak ada slot tersedia hari ini</p>
          )}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginBottom:8 }}>
        <label style={{ fontSize:12, color:S.gray, display:'block', marginBottom:6, fontWeight:500 }}>
          Catatan (opsional)
        </label>
        <input
          className="c-input"
          placeholder="Contoh: tolong siapkan jam pas, saya buru-buru"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      {selectedDate && selectedTime && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, fontSize:12, color:S.green }}>
          ✓ Ambil pada: <strong>{currentSlot?.label}, {selectedTime}</strong>
        </div>
      )}
    </div>
  )
}