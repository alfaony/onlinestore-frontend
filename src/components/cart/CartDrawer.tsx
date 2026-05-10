// frontend/src/components/cart/CartDrawer.tsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'
import { formatRupiah } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props { open: boolean; onClose: () => void }

export default function CartDrawer({ open, onClose }: Props) {
    const { items, updateQuantity, removeItem, total } = useCartStore()

    return (
        <>
            {/* Backdrop */}
            {open && <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />}

            {/* Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl
        transform transition-transform duration-300 flex flex-col
        ${open ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="font-playfair font-bold text-lg text-[--color-primary]">
                        Keranjang
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                            <ShoppingBag className="w-16 h-16 opacity-30" />
                            <p className="text-sm">Keranjang masih kosong</p>
                            <Button variant="outline" size="sm" onClick={onClose}
                                className="border-[--color-primary] text-[--color-primary]">
                                Lihat Menu
                            </Button>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.product.id} className="flex gap-3">
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-amber-50">
                                    {item.product.primary_image ? (
                                        <Image src={item.product.primary_image.image_path}
                                            alt={item.product.name} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🍜</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-800 truncate">{item.product.name}</p>
                                    <p className="text-sm text-[--color-primary] font-semibold">
                                        {formatRupiah(item.product.price)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Button variant="outline" size="icon" className="w-6 h-6"
                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                            <Minus className="w-3 h-3" />
                                        </Button>
                                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="w-6 h-6"
                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                            <Plus className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <button onClick={() => removeItem(item.product.id)}
                                    className="text-gray-300 hover:text-red-400 transition-colors self-start">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t border-gray-100 p-4 space-y-3">
                        <div className="flex justify-between font-bold text-gray-800">
                            <span>Total</span>
                            <span className="text-[--color-primary]">{formatRupiah(total())}</span>
                        </div>
                        <Link href="/checkout" onClick={onClose}>
                            <Button className="w-full bg-[--color-primary] hover:bg-[--color-primary-dark] text-white rounded-xl h-12">
                                Lanjut Checkout
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}