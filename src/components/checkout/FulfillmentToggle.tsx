'use client'

const S = {
  red:'#C41E3A', navy:'#1B3A6B', creamDp:'#EDD9B8',
  gray:'#6B7280', grayL:'#F3F0EB', dark:'#1A1A2E', green:'#10B981',
}

export type FulfillmentType = 'delivery' | 'pickup'

interface Props {
  value: FulfillmentType
  onChange: (v: FulfillmentType) => void
}

export default function FulfillmentToggle({ value, onChange }: Props) {
  return (
    <div style={{ display:'flex', gap:8, marginBottom:20 }}>
      {[
        { key:'delivery', icon:'🚚', label:'Delivery', desc:'Diantar ke alamat' },
        { key:'pickup',   icon:'🏃', label:'Ambil Sendiri', desc:'Self pickup di cabang' },
      ].map(opt => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key as FulfillmentType)}
            style={{
              flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              padding:'14px 12px',
              border:`1.5px solid ${active ? S.red : S.creamDp}`,
              borderRadius:12,
              background: active ? 'rgba(196,30,58,0.06)' : '#fff',
              cursor:'pointer', transition:'all 0.2s',
            }}>
            <span style={{ fontSize:24 }}>{opt.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color: active ? S.red : S.dark }}>{opt.label}</span>
            <span style={{ fontSize:11, color:S.gray }}>{opt.desc}</span>
          </button>
        )
      })}
    </div>
  )
}