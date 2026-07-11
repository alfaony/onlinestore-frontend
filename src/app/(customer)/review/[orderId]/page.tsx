import ReviewPage from '@/components/review/ReviewPage'
import { Suspense } from 'react'

interface Props { params: Promise<{ orderId: string }> }

export default async function ProductReviewPage({ params }: Props) {
  const { orderId } = await params
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: 64 }}>
        <span className="animate-spin" style={{ display: 'inline-block', fontSize: 24 }}>⟳</span>
      </div>
    }>
      <ReviewPage orderId={orderId} />
    </Suspense>
  )
}
