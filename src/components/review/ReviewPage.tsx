'use client'

import StarRatingInput from '@/components/ui/StarRatingInput'
import api from '@/lib/api'
import { storageUrl } from '@/lib/utils'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const S = {
  red: '#C41E3A', navy: '#1B3A6B', gold: '#E8A020',
  gray: '#6B7280', grayL: '#F3F0EB', dark: '#1A1A2E',
  green: '#10B981', creamDp: '#EDD9B8', creamD: '#F5EDD9',
}

const SESSION_TTL_SECONDS = 20 * 60
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

interface Aspect { id: string; name: string; slug: string }

interface ExistingReview {
  comment: string | null
  photo_url: string | null
  ratings: Record<string, number>
}

interface ReviewItem {
  order_item_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  quantity: number
  preparation_method: 'frozen' | 'kukus' | 'goreng' | null
  existing_review: ExistingReview | null
}

const PREPARATION_LABELS: Record<NonNullable<ReviewItem['preparation_method']>, string> = {
  frozen: '❄️ Frozen',
  kukus: '♨️ Dikukus',
  goreng: '🔥 Digoreng',
}

interface SessionResponse {
  order_number: string
  session_token: string
  expires_in: number
  aspects: Aspect[]
  items: ReviewItem[]
}

interface ItemFormState {
  ratings: Record<string, number>
  comment: string
  photoFile: File | null
  photoPreview: string | null
  saved: boolean
}

function errorMessage(error: unknown, fallback: string) {
  return axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}

function buildInitialItemState(item: ReviewItem): ItemFormState {
  return {
    ratings: { ...(item.existing_review?.ratings ?? {}) },
    comment: item.existing_review?.comment ?? '',
    photoFile: null,
    photoPreview: item.existing_review?.photo_url ?? null,
    saved: Boolean(item.existing_review),
  }
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function ReviewPage({ orderId }: { orderId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = searchParams.get('t')

  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fatalError, setFatalError] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(SESSION_TTL_SECONDS)
  const [expired, setExpired] = useState(false)
  const [itemStates, setItemStates] = useState<Record<string, ItemFormState>>({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submittingAll, setSubmittingAll] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function startCountdown(expiresIn: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSeconds(expiresIn)
    setExpired(false)
    intervalRef.current = setInterval(() => {
      setSeconds(current => {
        if (current <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          setExpired(true)
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  async function loadSession() {
    if (!t) {
      setFatalError('Link review tidak lengkap. Buka kembali link dari WhatsApp.')
      setLoading(false)
      return
    }
    setLoading(true)
    setFatalError(null)
    try {
      const { data } = await api.post<SessionResponse>(`/reviews/${orderId}/session`, { t })
      setSession(data)
      setItemStates(current => Object.fromEntries(data.items.map(item => [
        item.order_item_id,
        current[item.order_item_id]
          ? current[item.order_item_id]
          : buildInitialItemState(item),
      ])))
      startCountdown(data.expires_in)
    } catch (error) {
      setFatalError(errorMessage(error, 'Link review tidak valid atau sudah kadaluarsa.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSession()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, t])

  function updateItem(itemId: string, patch: Partial<ItemFormState>) {
    setItemStates(current => ({ ...current, [itemId]: { ...current[itemId], ...patch } }))
  }

  function onPhotoSelected(itemId: string, file: File | null) {
    if (!file) { updateItem(itemId, { photoFile: null }); return }
    if (!file.type.startsWith('image/')) { toast.error('File harus berupa gambar.'); return }
    if (file.size > MAX_PHOTO_BYTES) { toast.error('Ukuran foto maksimal 5MB.'); return }
    updateItem(itemId, { photoFile: file, photoPreview: URL.createObjectURL(file) })
  }

  async function submitAll() {
    if (!session) return
    const aspects = session.aspects

    const incomplete = session.items.filter(item => {
      const state = itemStates[item.order_item_id]
      return aspects.some(a => !state?.ratings[a.id])
    })
    if (incomplete.length > 0) {
      toast.error(`Lengkapi rating untuk: ${incomplete.map(i => i.product_name).join(', ')}`)
      document.getElementById(`review-item-${incomplete[0].order_item_id}`)?.scrollIntoView({ behavior:'smooth', block:'start' })
      return
    }

    setSubmittingAll(true)
    try {
      const formData = new FormData()
      formData.append('session_token', session.session_token)
      session.items.forEach((item, index) => {
        const state = itemStates[item.order_item_id]
        formData.append(`items[${index}][order_item_id]`, item.order_item_id)
        Object.entries(state.ratings).forEach(([aspectId, rating]) => {
          formData.append(`items[${index}][ratings][${aspectId}]`, String(rating))
        })
        if (state.comment.trim()) formData.append(`items[${index}][comment]`, state.comment.trim())
        if (state.photoFile) formData.append(`items[${index}][photo]`, state.photoFile)
      })

      await api.post(`/reviews/${orderId}/submit-all`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setItemStates(current => Object.fromEntries(
        Object.entries(current).map(([id, state]) => [id, { ...state, saved: true, photoFile: null }])
      ))
      setShowSuccessModal(true)
    } catch (error) {
      const message = errorMessage(error, 'Gagal mengirim ulasan.')
      toast.error(message)
      if (message.toLowerCase().includes('sesi')) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setExpired(true)
      }
    } finally {
      setSubmittingAll(false)
    }
  }

  if (loading) {
    return (
      <div className="c-app" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: S.gray, fontSize: 13 }}>Memuat halaman ulasan…</p>
      </div>
    )
  }

  if (fatalError) {
    return (
      <div className="c-app" style={{ paddingTop: 60, paddingBottom: 60, maxWidth: 560, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: `1.5px solid rgba(196,30,58,0.25)`, textAlign: 'center' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>✕</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: S.red, marginBottom: 6 }}>Tidak bisa membuka halaman ulasan</p>
          <p style={{ fontSize: 12, color: S.gray, lineHeight: 1.6 }}>{fatalError}</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  const allSaved = session.items.every(item => itemStates[item.order_item_id]?.saved)
  const filledCount = session.items.filter(item =>
    session.aspects.every(a => itemStates[item.order_item_id]?.ratings[a.id])
  ).length
  const reviewComplete = filledCount === session.items.length

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60, maxWidth: 560, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: S.gold, fontSize: 11, fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>BERI ULASAN</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,5vw,34px)', fontWeight: 700, color: S.navy, marginBottom: 4 }}>
          {session.order_number}
        </h1>
        <p style={{ fontSize: 13, color: S.gray }}>Ceritakan pengalamanmu untuk tiap olahan produk di bawah ini.</p>
      </div>

      <div style={{ background:'#fff', border:`1px solid ${S.creamDp}`, borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:8, fontSize:12 }}>
          <span style={{ color:S.navy, fontWeight:800 }}>Progres penilaian</span>
          <span style={{ color:reviewComplete ? S.green : S.gray, fontWeight:700 }}>{filledCount} dari {session.items.length} item terisi</span>
        </div>
        <div style={{ height:7, overflow:'hidden', borderRadius:99, background:S.grayL }}>
          <div style={{ width:`${session.items.length ? (filledCount / session.items.length) * 100 : 0}%`, height:'100%', borderRadius:99, background:reviewComplete ? S.green : S.red, transition:'width .25s ease' }} />
        </div>
      </div>

      {!expired ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(27,58,107,.06)', marginBottom: 20, fontSize: 12 }}>
          <span style={{ color: seconds < 120 ? S.red : S.navy, fontWeight: 700 }}>⏱ Sesi aman {formatCountdown(seconds)}</span>
          <span style={{ color: S.gray }}>— draft tetap tersimpan saat sesi diperbarui</span>
        </div>
      ) : (
        <div style={{ padding: 20, borderRadius: 16, background: '#fff', border: `1.5px solid rgba(232,160,32,0.3)`, marginBottom: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#92600A', marginBottom: 6 }}>Sesi review sudah berakhir</p>
          <p style={{ fontSize: 12, color: S.gray, marginBottom: 14 }}>Muat ulang untuk mendapatkan sesi baru dan lanjutkan mengisi ulasan.</p>
          <button type="button" onClick={loadSession} className="c-btn c-btn-primary c-btn-md">Muat ulang</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: expired ? 0.5 : 1, pointerEvents: expired ? 'none' : 'auto' }}>
        {session.items.map((item, itemIndex) => {
          const state = itemStates[item.order_item_id]
          if (!state) return null
          return (
            <div id={`review-item-${item.order_item_id}`} key={item.order_item_id} style={{ scrollMarginTop:90, background: '#fff', borderRadius: 16, padding: 18, border: `1px solid ${state.saved ? 'rgba(16,185,129,.35)' : S.creamDp}` }}>
              <p style={{ color:S.red, fontSize:10, fontWeight:800, letterSpacing:1, marginBottom:8 }}>PRODUK {itemIndex + 1} DARI {session.items.length}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                {item.product_image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={storageUrl(item.product_image)} alt={item.product_name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: S.dark }}>{item.product_name}</p>
                  <p style={{ fontSize: 11, color: S.gray }}>
                    ×{item.quantity}{item.preparation_method ? ` · ${PREPARATION_LABELS[item.preparation_method]}` : ''}
                  </p>
                </div>
                {state.saved && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: S.green }}>✓ Tersimpan</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {session.aspects.map(aspect => (
                  <div key={aspect.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap:'wrap', gap: 10 }}>
                    <span style={{ fontSize: 12, color: S.dark, fontWeight: 600 }}>{aspect.name}</span>
                    <StarRatingInput
                      value={state.ratings[aspect.id] ?? 0}
                      onChange={value => updateItem(item.order_item_id, { ratings: { ...state.ratings, [aspect.id]: value } })}
                      label={`Rating ${aspect.name} untuk ${item.product_name}`}
                    />
                  </div>
                ))}
              </div>

              <textarea
                value={state.comment}
                onChange={event => updateItem(item.order_item_id, { comment: event.target.value })}
                placeholder="Komentar (opsional)"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${S.creamDp}`, fontSize: 13, resize: 'vertical', marginBottom: 12, fontFamily: 'inherit' }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <label style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 10, border: `1.5px dashed ${S.creamDp}`, cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }}>
                  {state.photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={state.photoPreview} alt="Foto ulasan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 20, color: S.gray }}>+</span>
                  )}
                  <input
                    type="file"
                    aria-label={`Tambahkan foto untuk ulasan ${item.product_name}`}
                    accept="image/*"
                    capture="environment"
                    onChange={event => onPhotoSelected(item.order_item_id, event.target.files?.[0] ?? null)}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ fontSize: 11, color: S.gray, lineHeight: 1.5 }}>Foto produk (opsional, maks 5MB)</p>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          onClick={submitAll}
          disabled={submittingAll || expired}
          className="c-btn c-btn-primary c-btn-md c-btn-full"
        >
          {submittingAll ? 'Menyimpan semua ulasan…' : allSaved ? 'Perbarui semua ulasan' : 'Simpan Semua Ulasan'}
        </button>
        <p style={{ fontSize: 11, color: S.gray, textAlign: 'center', marginTop: 8 }}>
          Semua ulasan di atas akan tersimpan dalam satu kali kirim.
        </p>
      </div>

      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-success-title"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(26,26,46,0.5)',
            display: 'grid', placeItems: 'center', zIndex: 1000, padding: 20,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 10 }}>✓</p>
            <p id="review-success-title" style={{ fontSize: 17, fontWeight: 800, color: S.dark, marginBottom: 6 }}>Semua ulasan tersimpan</p>
            <p style={{ fontSize: 12, color: S.gray, lineHeight:1.6, marginBottom: 20 }}>Terima kasih sudah menilai {session.items.length} item dalam pesanan ini.</p>
            <button
              type="button"
              onClick={() => router.replace(`/order/${session.order_number}`)}
              className="c-btn c-btn-primary c-btn-md c-btn-full"
            >
              Kembali ke Pesanan
            </button>
            <button type="button" onClick={() => router.replace('/')} className="c-btn c-btn-ghost c-btn-md c-btn-full" style={{ marginTop:8 }}>
              Ke Beranda
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
