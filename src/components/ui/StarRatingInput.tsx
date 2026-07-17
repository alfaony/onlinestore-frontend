'use client'

import { useState } from 'react'

const S = { gold: '#E8A020', grayL: '#D9D4C8' }

interface Props {
  value: number
  onChange: (value: number) => void
  size?: number
  label?: string
}

const RATING_LABELS = ['Belum dinilai', 'Kurang', 'Cukup', 'Baik', 'Sangat baik', 'Istimewa']

export default function StarRatingInput({ value, onChange, size = 24, label = 'Rating' }: Props) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div style={{ display:'flex', alignItems:'flex-end', flexDirection:'column', gap:3 }}>
      <div role="group" aria-label={label} style={{ display: 'inline-flex', gap: 0 }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            aria-pressed={value === star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            aria-label={`${star} bintang — ${RATING_LABELS[star]}`}
            style={{
              display:'grid',
              width:44,
              height:44,
              placeItems:'center',
              background: 'none',
              border: 0,
              padding: 0,
              lineHeight: 1,
              fontSize: size,
              color: star <= active ? S.gold : S.grayL,
              cursor: 'pointer',
            }}
          >
            ★
          </button>
        ))}
      </div>
      <span aria-live="polite" style={{ minHeight:16, color:'#6B7280', fontSize:11, fontWeight:600 }}>
        {value > 0 ? `${value}/5 · ${RATING_LABELS[value]}` : 'Pilih 1–5 bintang'}
      </span>
    </div>
  )
}
