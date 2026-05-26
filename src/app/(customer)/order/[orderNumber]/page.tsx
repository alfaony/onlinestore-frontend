// frontend/src/app/(customer)/order/[orderNumber]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import OrderTracking from '@/components/order/OrderTracking'
import api from '@/lib/api'

interface Props {
    params: Promise<{ orderNumber: string }>
}

export const metadata: Metadata = { title: 'Tracking Pesanan' }

export default async function TrackingPage({ params }: Props) {
    const { orderNumber } = await params
    try {
        const { data: order } = await api.get(`/orders/${orderNumber}/track`)
        return <OrderTracking order={order} />
    } catch {
        notFound()
    }
}