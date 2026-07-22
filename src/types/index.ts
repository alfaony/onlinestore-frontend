// frontend/src/types/index.ts
export type PreparationMethod = 'frozen' | 'kukus' | 'goreng'

export interface Product {
    id: string      // ← string UUID, BUKAN number
    name: string
    slug: string
    description: string
    price: number
    preparation_methods?: PreparationMethod[]
    is_active: boolean
    category: Category
    images: ProductImage[]
    primary_image: ProductImage | null
    shipping_discounts: ShippingDiscount[]
    popular: boolean
    is_best_seller?: boolean
    sold_quantity?: number
    stock: number;
    branch_availability?: string[]  // ← tambah kalau belum ada branch_availability
    branch_prices?: Record<string, number>
    available_at_selected_branch?: boolean | null
}

export interface Category {
    id: string
    name: string
    slug: string
    image: string | null
    image_url?: string | null
}

export interface ProductImage {
    id: string
    image_path: string
    image_url?: string | null
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
    is_accepting_orders?: boolean
    sells_frozen_only?: boolean
    can_cook?: boolean
    operational_status?: BranchOperationalStatus
}

export interface BranchOperationalStatus {
    code: 'open' | 'closing_soon' | 'closed' | 'paused' | 'inactive'
    label: string
    message: string
    accepting_orders: boolean
    scheduled_execution_at: string | null
    next_open_at: string | null
    closes_at: string | null
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
    fulfilled_subtotal: number
    cancelled_subtotal: number
    shipping_cost: number
    shipping_discount: number
    voucher_discount: number
    total: number
    affiliate_id?: string | null
    affiliate_code_snapshot?: string | null
    items: OrderItem[]
    shipping: Shipping | null
    payment: Payment | null
    histories: OrderStatusHistory[]
    refund_status: 'none' | 'requested' | 'processing' | 'completed' | 'partial' | 'full'
    refund_type: 'partial' | 'full' | null
    refund_request_number: string | null
    refund_amount: number
    refund_calculation: {
        cancelled_items_gross: number
        allocated_voucher_discount: number
        shipping_refunded: boolean
        shipping_amount: number
        shipping_discount: number
        final_refund: number
    } | null
    refund_reason: string | null
    refund_bank_name: string | null
    refund_account_number: string | null
    refund_account_name: string | null
    refund_transfer_reference: string | null
    refund_proof_url: string | null
    refund_proof_note: string | null
    refund_requested_at: string | null
    refund_processed_at: string | null
    refund_completed_at: string | null
    net_total: number
    created_at: string
}

export interface OrderItem {
    id: string
    product_name: string
    preparation_method?: 'frozen' | 'kukus' | 'goreng' | null
    price: number
    quantity: number
    subtotal: number
    is_removed?: boolean
    removed_reason?: string | null
}

export interface Shipping {
    courier: string
    service: string
    tracking_number: string | null
    estimated_days: number | null
    status: string
    booking_reference?: string | null
    booking_requested_at?: string | null
    booking_confirmed_at?: string | null
}

export interface Payment {
    payment_method: string
    amount: number
    status: string
    paid_at: string | null
}

export interface PromotionSummary {
    id: string
    code: string | null
    name: string
    description: string | null
    badge_text: string | null
    scope: 'product' | 'delivery' | 'order'
    delivery_scope: 'all' | 'instant' | 'non_instant'
    application_mode: 'automatic' | 'code'
    is_stackable: boolean
    eligible: boolean
    applied: boolean
    reason: string | null
    discount_amount: number
}

export interface PromotionPreview {
    subtotal: number
    shipping_charge: number
    product_discount: number
    shipping_discount: number
    total_discount: number
    grand_total: number
    applied_promotions: PromotionSummary[]
    available_promotions: PromotionSummary[]
}

export interface AffiliateValidateResponse {
    valid: boolean
    affiliate_name?: string
    message?: string
}

export interface OrderStatusHistory {
    status: OrderStatus
    note: string | null
    created_at: string
}

export type OrderStatus =
    | 'pending' | 'confirmed' | 'processing'
    | 'shipped' | 'delivered' | 'cancelled'

export interface ArticleCategory {
    id: string
    name: string
    slug: string
    articles_count?: number
}

export interface ArticleAuthor {
    id: number
    name: string
}

export interface Article {
    id: string
    title: string
    slug: string
    image: string | null
    image_url?: string | null
    meta_description: string | null
    published_at: string
    updated_at?: string
    category: ArticleCategory | null
    content?: string
    meta_title?: string | null
    author?: ArticleAuthor | null
}

export interface ArticleDetailResponse {
    article: Article & { content: string }
    related: Article[]
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
    preparation_methods?: PreparationMethod[]
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
