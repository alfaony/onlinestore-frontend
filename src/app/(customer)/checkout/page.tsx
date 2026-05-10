// frontend/src/app/(customer)/checkout/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/stores/cart.store'
import { useMemberStore } from '@/stores/member.store'
import { formatRupiah } from '@/lib/utils'
import OTPModal from '@/components/checkout/OTPModal'
import AddressForm from '@/components/checkout/AddressForm'
import ShippingOptions from '@/components/checkout/ShippingOptions'
import OrderSummary from '@/components/checkout/OrderSummary'
import VoucherInput from '@/components/checkout/VoucherInput'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, total, clearCart } = useCartStore()
    const { member, token } = useMemberStore()

    const [phone, setPhone] = useState(member?.phone ?? '')
    const [name, setName] = useState(member?.name ?? '')
    const [showOTP, setShowOTP] = useState(false)
    const [address, setAddress] = useState<any>(null)
    const [shipping, setShipping] = useState<any>(null)
    const [voucher, setVoucher] = useState<any>(null)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const subtotal = total()
    const shippingCost = shipping?.price ?? 0
    const shippingDisc = calculateShippingDiscount()
    const voucherDisc = voucher?.discount_amount ?? 0
    const grandTotal = subtotal + shippingCost - shippingDisc - voucherDisc

    function calculateShippingDiscount(): number {
        const totalQty = items.reduce((acc, i) => acc + i.quantity, 0)
        let maxDisc = 0

        items.forEach(item => {
            const disc = item.product.shipping_discounts?.find(d =>
                d.min_qty <= item.quantity &&
                (d.max_qty === null || item.quantity <= d.max_qty)
            )
            if (!disc) return

            if (disc.discount_type === 'free') {
                maxDisc = shippingCost
            } else if (disc.discount_type === 'percent') {
                const d = (shippingCost * disc.discount_value) / 100
                maxDisc = Math.max(maxDisc, disc.max_discount ? Math.min(d, disc.max_discount) : d)
            } else {
                maxDisc = Math.max(maxDisc, disc.discount_value)
            }
        })

        return Math.min(maxDisc, shippingCost)
    }

    async function handleOrder() {
        if (!phone) { setShowOTP(true); return }
        if (!token) { setShowOTP(true); return }
        await placeOrder()
    }

    async function placeOrder() {
        setLoading(true)
        try {
            const { data } = await api.post('/orders', {
                phone,
                name,
                branch_id: items[0]?.branch_id,
                voucher_id: voucher?.id,
                items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
                shipping: { courier: shipping.courier, service: shipping.service, cost: shippingCost },
                address,
                notes,
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })

            // Inisiasi Midtrans
            const { data: payment } = await api.post(`/orders/${data.id}/payment`)
            clearCart()

            // Redirect ke Midtrans Snap
            window.snap.pay(payment.midtrans_token, {
                onSuccess: () => router.push(`/order/${data.order_number}`),
                onPending: () => router.push(`/order/${data.order_number}`),
                onError: () => alert('Pembayaran gagal, silakan coba lagi.'),
            })
        } catch (e: any) {
            alert(e?.response?.data?.message ?? 'Terjadi kesalahan.')
        } finally {
            setLoading(false)
        }
    }

    if (items.length === 0) {
        return (
            <div className="max-w-xl mx-auto px-4 py-24 text-center">
                <p className="text-gray-500 mb-4">Keranjang kamu kosong.</p>
                <Button onClick={() => router.push('/menu')}
                    className="bg-[--color-primary] text-white rounded-xl">
                    Lihat Menu
                </Button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            <h1 className="font-playfair text-3xl font-bold text-[--color-primary] mb-8">Checkout</h1>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left — Form */}
                <div className="md:col-span-2 space-y-6">

                    {/* Kontak */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h2 className="font-semibold text-gray-800 mb-4">Informasi Penerima</h2>
                        <div className="space-y-4">
                            <div>
                                <Label>Nomor WhatsApp</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input placeholder="08xxxxxxxxxx" value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        disabled={!!member} />
                                    {!member && (
                                        <Button variant="outline"
                                            className="border-[--color-primary] text-[--color-primary] shrink-0"
                                            onClick={() => setShowOTP(true)}>
                                            Verifikasi
                                        </Button>
                                    )}
                                </div>
                                {member && (
                                    <p className="text-xs text-green-600 mt-1">✓ Terverifikasi sebagai member</p>
                                )}
                            </div>
                            <div>
                                <Label>Nama Penerima</Label>
                                <Input className="mt-1" placeholder="Nama lengkap"
                                    value={name} onChange={e => setName(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Alamat */}
                    <AddressForm onSelect={setAddress} member={member} />

                    {/* Pilih Pengiriman */}
                    {address && (
                        <ShippingOptions
                            address={address}
                            branchId={items[0]?.branch_id}
                            onSelect={setShipping}
                        />
                    )}

                    {/* Voucher */}
                    <VoucherInput
                        subtotal={subtotal}
                        onApply={setVoucher}
                        memberStatus={member ? (member as any).new_reward_claimed ? 'old' : 'new' : null}
                    />

                    {/* Catatan */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <Label>Catatan (opsional)</Label>
                        <textarea
                            className="mt-1 w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-100"
                            rows={3} placeholder="Pesan khusus untuk penjual..."
                            value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                {/* Right — Summary */}
                <div className="space-y-4">
                    <OrderSummary
                        items={items}
                        subtotal={subtotal}
                        shippingCost={shippingCost}
                        shippingDiscount={shippingDisc}
                        voucherDiscount={voucherDisc}
                        total={grandTotal}
                    />
                    <Button
                        className="w-full bg-[--color-primary] hover:bg-[--color-primary-dark]
              text-white rounded-xl h-12 text-base font-medium"
                        disabled={!address || !shipping || loading}
                        onClick={handleOrder}>
                        {loading ? 'Memproses...' : `Bayar ${formatRupiah(grandTotal)}`}
                    </Button>
                    <p className="text-xs text-center text-gray-400">
                        Pembayaran aman via Midtrans
                    </p>
                </div>
            </div>

            <OTPModal
                open={showOTP}
                phone={phone}
                onClose={() => setShowOTP(false)}
                onVerified={() => { setShowOTP(false) }}
            />
        </div>
    )
}