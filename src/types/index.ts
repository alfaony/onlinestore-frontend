// frontend/src/types/index.ts
export interface Product {
    id: string      // ← string UUID, BUKAN number
    name: string
    slug: string
    description: string
    price: number
    is_active: boolean
    category: Category
    images: ProductImage[]
    primary_image: ProductImage | null
    shipping_discounts: ShippingDiscount[]
    popular: boolean
    stock: number;
}

export interface Category {
    id: string
    name: string
    slug: string
    image: string | null
}

export interface ProductImage {
    id: string
    image_path: string
    is_primary: boolean
    sort_order: number
}

export interface ShippingDiscount {
    id: string
    min_qty: number
    max_qty: number | null
    discount_type: 'percent' | 'nominal' | 'free'
    discount_value: number
    max_discount: number | null
}

export interface Branch {
    id: string
    name: string
    address: string
    phone: string
    latitude: number | null
    longitude: number | null
}

export interface Member {
    id: string
    phone: string
    name: string | null
    email: string | null
    addresses: MemberAddress[]
}

export interface MemberAddress {
    id: string
    label: string
    address: string
    latitude: number | null
    longitude: number | null
    detail: string | null
    is_default: boolean
}

export interface Order {
    id: string
    order_number: string
    status: OrderStatus
    payment_status: 'unpaid' | 'paid' | 'refunded'
    subtotal: number
    shipping_cost: number
    shipping_discount: number
    voucher_discount: number
    total: number
    items: OrderItem[]
    shipping: Shipping | null
    payment: Payment | null
    histories: OrderStatusHistory[]
    created_at: string
}

export interface OrderItem {
    id: string
    product_name: string
    price: number
    quantity: number
    subtotal: number
}

export interface Shipping {
    courier: string
    service: string
    tracking_number: string | null
    estimated_days: number | null
    status: string
}

export interface Payment {
    payment_method: string
    amount: number
    status: string
    paid_at: string | null
}

export interface OrderStatusHistory {
    status: OrderStatus
    note: string | null
    created_at: string
}

export type OrderStatus =
    | 'pending' | 'confirmed' | 'processing'
    | 'shipped' | 'delivered' | 'cancelled'

export interface Article {
    id: string
    title: string
    slug: string
    image: string | null
    meta_description: string | null
    published_at: string
    category: Category | null
}

export interface Member {
    id: string
    phone: string
    name: string | null
    email: string | null
    is_verified: boolean
    new_reward_claimed: boolean  // ← tambah
    addresses: MemberAddress[]
}

export interface CartItem {
    id: string
    name: string
    slug: string
    price: number
    description?: string
    primary_image?: ProductImage | null
    qty: number
    branchId: string
    branchName: string  // ← tambah
}

export interface Product {
    id: string      // ← string UUID, BUKAN number
    name: string
    slug: string
    description: string
    price: number
    is_active: boolean
    category: Category
    images: ProductImage[]
    primary_image: ProductImage | null
    shipping_discounts: ShippingDiscount[],
    qty: number
    branchId: string
}