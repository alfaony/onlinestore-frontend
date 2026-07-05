import OrderTracking, { type TrackingOrder } from '@/components/order/OrderTracking'
import api from '@/lib/api'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ orderNumber: string }> }

async function getOrder(orderNumber: string): Promise<TrackingOrder | null> {
  try {
    return (await api.get<TrackingOrder>(`/orders/${orderNumber}/track`)).data
  } catch {
    return null
  }
}

export default async function TrackingPage({ params }: Props) {
  const { orderNumber } = await params
  const order = await getOrder(orderNumber)
  if (!order) notFound()

  return <OrderTracking order={order}/>
}
