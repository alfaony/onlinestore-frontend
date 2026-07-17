'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useTransition } from 'react'
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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const safeCategories = Array.isArray(categories) ? categories : []

  function push(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    start(() => router.push(`/menu?${p.toString()}`))
  }

  function scheduleSearch(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => push('search', value || null), 300)
  }

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Search + Sort */}
      <div className="flex flex-col gap-3 sm:flex-row" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            defaultValue={search}
            onChange={e => scheduleSearch(e.target.value)}
            aria-label="Cari menu"
            placeholder="Cari menu favoritmu..."
            className="c-input"
            style={{ paddingLeft: 42, paddingRight: search ? 36 : 14, borderColor: search ? '#C41E3A' : '#EDD9B8' }}
          />
          {search && (
            <button
              onClick={() => {
                if (searchTimer.current) clearTimeout(searchTimer.current)
                push('search', null)
              }}
              aria-label="Hapus pencarian"
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
          aria-label="Urutkan menu"
          onChange={e => push('sort', e.target.value)}
          defaultValue={params.get('sort') ?? 'popular'}
          className="c-input"
          style={{ width: 'auto', minWidth: 170, paddingLeft: 14, cursor: 'pointer' }}>
          <option value="popular">Terpopuler</option>
          <option value="price_asc">Harga Terendah</option>
          <option value="price_desc">Harga Tertinggi</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        {[{ id: null, slug: null, name: 'Semua' }, ...safeCategories].map(c => {
          const active = c.slug === null ? !selected : selected === c.slug
          return (
            <button
              key={c.slug ?? 'all'}
              onClick={() => push('category', c.slug)}
              style={{
                padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${active ? '#C41E3A' : '#EDD9B8'}`,
                background: active ? '#C41E3A' : 'transparent',
                color: active ? '#fff' : '#1B3A6B',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                fontFamily: "var(--font-body), ui-sans-serif, system-ui, sans-serif",
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
