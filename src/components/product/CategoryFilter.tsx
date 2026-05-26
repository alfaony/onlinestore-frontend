'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  selected?: string
  search?: string
}

export default function CategoryFilter({ categories, selected, search }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const safeCategories = Array.isArray(categories) ? categories : []

  function push(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    value ? p.set(key, value) : p.delete(key)
    start(() => router.push(`/menu?${p.toString()}`))
  }

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Search + Sort */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            defaultValue={search}
            onChange={e => push('search', e.target.value || null)}
            placeholder="Cari menu Palembang favorit kamu..."
            className="c-input"
            style={{ paddingLeft: 42, paddingRight: search ? 36 : 14, borderColor: search ? '#C41E3A' : '#EDD9B8' }}
          />
          {search && (
            <button
              onClick={() => push('search', null)}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: '#F3F0EB', border: 'none', width: 22, height: 22,
                borderRadius: '50%', fontSize: 11, color: '#6B7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
              ✕
            </button>
          )}
        </div>

        <select
          onChange={e => push('sort', e.target.value)}
          defaultValue={params.get('sort') ?? 'popular'}
          className="c-input"
          style={{ width: 'auto', paddingLeft: 14, cursor: 'pointer' }}>
          <option value="popular">Terpopuler</option>
          <option value="price_asc">Harga Terendah</option>
          <option value="price_desc">Harga Tertinggi</option>
        </select>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[{ id: null, slug: null, name: 'Semua' }, ...safeCategories].map(c => {
          const active = c.slug === null ? !selected : selected === c.slug
          return (
            <button
              key={c.slug ?? 'all'}
              onClick={() => push('category', c.slug)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${active ? '#C41E3A' : '#EDD9B8'}`,
                background: active ? '#C41E3A' : 'transparent',
                color: active ? '#fff' : '#1B3A6B',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
              {c.name}
            </button>
          )
        })}
      </div>

      {pending && (
        <p style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>Memuat...</p>
      )}
    </div>
  )
}
