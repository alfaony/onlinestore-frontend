'use client'

import { useState } from 'react'

const S = { gold: '#E8A020', grayL: '#D9D4C8' }

interface Props {
  value: number
  onChange: (value: number) => void
  size?: number
}

export default function StarRatingInput({ value, onChange, size = 28 }: Props) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div style={{ display: 'inline-flex', gap: 4 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          aria-label={`${star} bintang`}
          style={{
            background: 'none',
            border: 0,
            padding: 2,
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
  )
}
