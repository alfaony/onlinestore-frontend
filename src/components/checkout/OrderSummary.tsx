// frontend/src/components/checkout/OrderSummary.tsx
import { CartItem } from '@/types'
import { formatRupiah } from '@/lib/utils'
import Image from 'next/image'

interface Props {
    items: CartItem[]
    subtotal: number
    shippingCost: number
    shippingDiscount: number
    voucherDiscount: number
    total: number
}

export default function OrderSummary({
    items, subtotal, shippingCost, shippingDiscount, voucherDiscount, total
}: Props) {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-20">
            <h2 className="font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h2>

            {/* Items */}
            <div className="space-y-3 mb-4">
                {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-amber-50 shrink-0">
                            {item.product.primary_image ? (
                                <Image src={item.product.primary_image.image_path}
                                    alt={item.product.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">🍜</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{item.product.name}</p>
                            <p className="text-xs text-gray-400">× {item.quantity}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-700 shrink-0">
                            {formatRupiah(item.product.price * item.quantity)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                    <span>Ongkir</span>
                    <span>{shippingCost > 0 ? formatRupiah(shippingCost) : '-'}</span>
                </div>
                {shippingDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon Ongkir</span>
                        <span>-{formatRupiah(shippingDiscount)}</span>
                    </div>
                )}
                {voucherDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Voucher</span>
                        <span>-{formatRupiah(voucherDiscount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span className="text-[--color-primary] text-lg">{formatRupiah(total)}</span>
                </div>
            </div>
        </div>
    )
}