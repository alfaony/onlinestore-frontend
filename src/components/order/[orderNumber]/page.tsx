import OrderTracking from '@/components/order/OrderTracking'
import api from '@/lib/api'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ orderNumber: string }> }

export default async function TrackingPage({ params }: Props) {
  const { orderNumber } = await params
  try {
    const { data } = await api.get(`/orders/${orderNumber}/track`)
    return <OrderTracking order={data}/>
  } catch {
    notFound()
  }
}