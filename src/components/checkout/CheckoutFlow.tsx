'use client'
import api from '@/lib/api'
import { formatRupiah } from '@/lib/utils'
import {
  groupCartByBranch,
  useCartBranchCount,
  useCartItems,
  useCartStore,
  type BranchGroup
} from '@/stores/cart.store'
import { useMemberStore } from '@/stores/member.store'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import AddressForm from './AddressForm'
import OTPModal from './OTPModal'
import ShippingOptions from './ShippingOptions'
import VoucherInput from './VoucherInput'

interface Props {
  onPaymentSuccess?: () => void
}

const S = {
  red: '#C41E3A', navy: '#1B3A6B', gold: '#E8A020',
  creamDp: '#EDD9B8', creamD: '#F5EDD9',
  gray: '#6B7280', grayL: '#F3F0EB', grayM: '#E5E2DC',
  dark: '#1A1A2E', green: '#10B981',
}

// ─── Step Indicator ───────────────────────────────────────
const STEPS = [
  { n: '1', label: 'Verifikasi', sub: 'OTP WhatsApp', icon: '📱' },
  { n: '2', label: 'Alamat', sub: 'Lokasi Pengiriman', icon: '📍' },
  { n: '3', label: 'Pembayaran', sub: 'Metode Bayar', icon: '💳' },
]

function StepBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 28 }}>
      {STEPS.map((s, i) => (
        <div key={s.n} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step > i ? S.green : step === i + 1 ? S.red : S.grayL,
                color: step >= i + 1 ? '#fff' : S.gray,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0,
                boxShadow: step === i + 1 ? '0 0 0 4px rgba(196,30,58,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '✓' : step === i + 1 ? s.icon : s.n}
              </div>
              <div className="hidden sm:block">
                <div style={{ fontSize: 11, fontWeight: 600, color: step === i + 1 ? S.red : step > i ? S.green : S.gray }}>{s.label}</div>
                <div style={{ fontSize: 10, color: S.gray }}>{s.sub}</div>
              </div>
            </div>
          </div>
          {i < 2 && <div style={{ flex: 0, width: 20, height: 2, background: step > i + 1 ? S.green : S.grayM, borderRadius: 1, margin: '0 4px', transition: 'background 0.3s' }} />}
        </div>
      ))}
    </div>
  )
}

// ─── Sidebar Summary ──────────────────────────────────────
function Sidebar({ grouped, shippings, voucherDiscount }: {
  grouped: BranchGroup[]
  shippings: Record<string, any>
  voucherDiscount: number
}) {
  const totalItems = grouped.reduce((s, g) => s + g.subtotal, 0)
  const totalShip = grouped.reduce((s, g) => s + (shippings[g.branchId]?.price ?? 0), 0)
  const grand = totalItems + totalShip - voucherDiscount

  return (
    <div style={{ width: '100%', maxWidth: 290, background: '#fff', borderRadius: 16, padding: 20, border: `1px solid ${S.creamDp}`, position: 'sticky', top: 80, alignSelf: 'start', flexShrink: 0 }}>
      <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: S.navy, marginBottom: 14 }}>Ringkasan</h3>

      {grouped.map(({ branchId, branchName, items, subtotal }) => (
        <div key={branchId} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${S.grayL}` }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: S.navy, marginBottom: 8 }}>📍 {branchName}</p>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ width: 32, height: 32, background: S.creamD, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🍜</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: S.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name} × {item.qty}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{formatRupiah(item.price * item.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: S.gray, marginTop: 6 }}>
            <span>Ongkir</span>
            <span>{shippings[branchId] ? formatRupiah(shippings[branchId].price) : '—'}</span>
          </div>
        </div>
      ))}

      <div style={{ paddingTop: 4 }}>
        {voucherDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: S.green, marginBottom: 4 }}>
            <span>Voucher</span><span>− {formatRupiah(voucherDiscount)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Total Bayar</span>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 700, color: S.red }}>{formatRupiah(grand)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────
export default function CheckoutFlow({ onPaymentSuccess }: Props) {
  const router = useRouter()

  const items = useCartItems()
  const branchCount = useCartBranchCount()
  const clearCart = useCartStore(s => s.clearCart)

  const grouped = useMemo(() => groupCartByBranch(items), [items])

  const { member, token } = useMemberStore()

  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState(member?.phone?.replace(/^(62|0)/, '') ?? '')
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState('')
  const [showOTP, setShowOTP] = useState(false)

  const [address, setAddress] = useState<any>(null)
  const [shippings, setShippings] = useState<Record<string, any>>({})

  const [voucher, setVoucher] = useState<any>(null)
  const [payMethod, setPayMethod] = useState('transfer')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const allShippingPicked = grouped.every(g => !!shippings[g.branchId])
  const voucherDiscount = voucher?.discount_amount ?? 0
  const grandTotal = grouped.reduce((s, g) => s + g.subtotal + (shippings[g.branchId]?.price ?? 0), 0) - voucherDiscount

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  async function placeOrder() {
    if (!address) { toast.error('Pilih alamat pengiriman'); return }
    if (!allShippingPicked) { toast.error('Pilih kurir untuk semua cabang'); return }
    setLoading(true)
    try {
      const { data } = await api.post('/orders', {
        phone: '0' + phone,
        name,
        email,
        notes,
        voucher_id: voucher?.id ?? null,
        // ✅ address kirim objek lengkap
        address: {
          address: address.address,
          detail: address.detail,
          province_name: address.province_name,
          regency_name: address.regency_name,
          district_name: address.district_name,
          village_name: address.village_name,
          postal_code: address.postal_code,
          latitude: address.latitude,
          longitude: address.longitude,
        },
        branches: grouped.map(g => ({
          branch_id: g.branchId,
          items: g.items.map(i => ({
            product_id: i.id,
            quantity: i.qty,
            price: i.price,
          })),
          shipping: {
            courier: shippings[g.branchId].courier,
            service: shippings[g.branchId].service,
            cost: shippings[g.branchId].price,
          },
        })),
      }, { headers: authHeader })

      const { data: payment } = await api.post('/orders/payment/initiate', {
        order_numbers: data.order_numbers,
      }, { headers: authHeader })

        ; (window as any).snap?.pay(payment.midtrans_token, {
          onSuccess: () => {
            onPaymentSuccess?.()   // ← set flag dulu
            router.push(`/checkout/success?orders=${data.order_numbers.join(',')}`)
          },
          onPending: () => {
            onPaymentSuccess?.()
            router.push(`/checkout/success?orders=${data.order_numbers.join(',')}`)
          },
          onError: () => toast.error('Pembayaran gagal. Coba lagi.'),
          onClose: () => toast.info('Pembayaran dibatalkan.'),
        })
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleNextStep1() {
    if (!name) { toast.error('Isi nama penerima'); return }

    // ✅ Kalau member login → simpan name & email ke DB
    if (member && token) {
      try {
        const { data } = await api.put('/member/profile',
          { name, email: email || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        // Update local store dengan data dari DB
        useMemberStore.getState().setMember(data, token)
      } catch {
        toast.error('Gagal menyimpan profil')
        return
      }
    }

    setStep(2)
  }

  return (
    <div className="c-app" style={{ paddingTop: 44, paddingBottom: 60 }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: S.gray, fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        ← Kembali ke Menu
      </button>

      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(32px,5vw,42px)', fontWeight: 700, color: S.navy, marginBottom: 8 }}>
        Checkout
      </h1>

      {branchCount > 1 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(27,58,107,0.06)', border: '1px solid rgba(27,58,107,0.1)', borderRadius: 8, padding: '6px 12px', marginBottom: 20, fontSize: 12, color: S.navy }}>
          🏪 {branchCount} cabang · dikirim terpisah · 1 pembayaran
        </div>
      )}

      <StepBar step={step} />

      <div style={{ display: 'flex', gap: 24, alignItems: 'start', flexWrap: 'wrap' }}>

        {/* ── Form ── */}
        <div style={{ flex: 1, minWidth: 300 }}>

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 26, border: `1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: S.navy, marginBottom: 6 }}>Verifikasi WhatsApp</h2>
              <p style={{ fontSize: 12, color: S.gray, marginBottom: 20 }}>Verifikasi nomor HP untuk melanjutkan checkout</p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Nomor WhatsApp *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: S.gray }}>+62</span>
                    <input className="c-input" style={{ paddingLeft: 44 }} placeholder="8xxxxxxxxxx" value={phone} onChange={e => setPhone(e.target.value.replace(/^0/, ''))} disabled={!!member} />
                  </div>
                  {!member && (
                    <button onClick={() => setShowOTP(true)} className="c-btn c-btn-primary c-btn-sm" style={{ flexShrink: 0 }}>
                      Kirim OTP
                    </button>
                  )}
                </div>
                {member
                  ? <p style={{ fontSize: 11, color: S.green, marginTop: 4 }}>✓ Terverifikasi sebagai member</p>
                  : <p style={{ fontSize: 11, color: S.gray, marginTop: 4 }}>Kode OTP akan dikirim via WhatsApp</p>
                }
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Nama Penerima *</label>
                  <input className="c-input" placeholder="Nama lengkap" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Email (opsional)</label>
                  <input className="c-input" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              <div style={{ background: S.grayL, borderRadius: 10, padding: 12, marginBottom: 16, display: 'flex', gap: 8 }}>
                <span>💡</span>
                <p style={{ fontSize: 11, color: S.gray, lineHeight: 1.6 }}>
                  Member baru mendapat <strong style={{ color: S.red }}>voucher gratis ongkir</strong> untuk pesanan pertama!
                </p>
              </div>

              <button
                onClick={handleNextStep1}
                disabled={!name || (!member && !phone)}
                className="c-btn c-btn-primary c-btn-lg c-btn-full">
                Lanjut ke Alamat →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 26, border: `1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: S.navy, marginBottom: 6 }}>Alamat Pengiriman</h2>
              <p style={{ fontSize: 12, color: S.gray, marginBottom: 20 }}>
                1 alamat untuk {branchCount > 1 ? `semua ${branchCount} cabang` : 'pengiriman'}
              </p>

              <AddressForm onSelect={setAddress} member={member} />

              {/* Shipping per branch */}
              {address && (
                <div style={{ marginTop: 20, borderTop: `1px solid ${S.grayL}`, paddingTop: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: S.dark, marginBottom: 14 }}>🚚 Pilih Kurir per Cabang</p>
                  {grouped.map(g => (
                    <div key={g.branchId} style={{ marginBottom: 16, padding: 16, border: `1.5px solid ${shippings[g.branchId] ? 'rgba(16,185,129,0.3)' : S.creamDp}`, borderRadius: 12, background: shippings[g.branchId] ? 'rgba(16,185,129,0.03)' : '#fff', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                        <span>📍</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: S.navy }}>{g.branchName}</span>
                        <span style={{ fontSize: 11, color: S.gray }}>· {formatRupiah(g.subtotal)}</span>
                        {shippings[g.branchId] && <span style={{ fontSize: 10, color: S.green, marginLeft: 'auto', fontWeight: 600 }}>✓ Dipilih</span>}
                      </div>
                      <ShippingOptions
                        address={address}
                        branchId={g.branchId}
                        onSelect={rate => setShippings(prev => ({ ...prev, [g.branchId]: rate }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={() => setStep(1)} className="c-btn c-btn-ghost c-btn-md" style={{ flex: 1 }}>← Kembali</button>
                <button onClick={() => setStep(3)} disabled={!address || !allShippingPicked} className="c-btn c-btn-primary c-btn-md" style={{ flex: 2 }}>
                  Lanjut ke Pembayaran →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: 26, border: `1px solid ${S.creamDp}` }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: S.navy, marginBottom: 6 }}>Pembayaran</h2>
              <p style={{ fontSize: 12, color: S.gray, marginBottom: 20 }}>1 transaksi untuk semua cabang</p>

              <VoucherInput subtotal={grouped.reduce((s, g) => s + g.subtotal, 0)} memberStatus={member ? 'member' : 'guest'} onApply={setVoucher} />

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 8, fontWeight: 500 }}>Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['💳', 'transfer', 'Transfer Bank', 'BCA, Mandiri, BNI'], ['📱', 'qris', 'QRIS', 'GoPay, OVO, Dana'], ['🏧', 'va', 'Virtual Account', 'Semua bank'], ['💰', 'cod', 'COD', 'Bayar di tempat']].map(([ic, val, t, s]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: `1.5px solid ${payMethod === val ? S.red : S.creamDp}`, borderRadius: 10, cursor: 'pointer', background: payMethod === val ? 'rgba(196,30,58,0.04)' : '#fff', transition: 'all 0.18s' }}>
                      <input type="radio" name="pay" value={val} checked={payMethod === val} onChange={() => setPayMethod(val)} style={{ accentColor: S.red, width: 16, height: 16 }} />
                      <span style={{ fontSize: 20 }}>{ic}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: S.dark }}>{t}</div>
                        <div style={{ fontSize: 10, color: S.gray }}>{s}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: S.gray, display: 'block', marginBottom: 5, fontWeight: 500 }}>Catatan (opsional)</label>
                <textarea className="c-input" style={{ resize: 'none', height: 76 }} placeholder="Catatan untuk semua cabang..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>

              {branchCount > 1 && (
                <div style={{ background: 'rgba(27,58,107,0.05)', border: '1px solid rgba(27,58,107,0.1)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: S.navy }}>
                  ℹ️ Kamu akan membuat <strong>{branchCount} pesanan terpisah</strong> dengan 1 kali pembayaran. Setiap cabang mengirimkan paketnya sendiri.
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button onClick={() => setStep(2)} className="c-btn c-btn-ghost c-btn-md" style={{ flex: 1 }}>← Kembali</button>
                <button onClick={placeOrder} disabled={loading} className="c-btn c-btn-navy c-btn-md" style={{ flex: 2 }}>
                  {loading ? '⏳ Memproses...' : `💳 Bayar ${formatRupiah(grandTotal)}`}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                {['🔒 SSL', 'Midtrans', 'PCI DSS'].map(t => (
                  <span key={t} style={{ fontSize: 10, color: S.gray, background: S.grayL, padding: '3px 8px', borderRadius: 4 }}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <Sidebar grouped={grouped} shippings={shippings} voucherDiscount={voucherDiscount} />
      </div>

      {showOTP && (
        <OTPModal open={showOTP} phone={'0' + phone} onClose={() => setShowOTP(false)} onVerified={() => { setShowOTP(false); setStep(2) }} />
      )}
    </div>
  )
}
