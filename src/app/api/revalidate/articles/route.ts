import { timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: Request): boolean {
  const expected = process.env.FRONTEND_REVALIDATION_SECRET
  const authorization = request.headers.get('authorization')
  const provided = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''

  if (!expected || !provided) return false

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  return expectedBuffer.length === providedBuffer.length
    && timingSafeEqual(expectedBuffer, providedBuffer)
}

export async function POST(request: Request) {
  if (!process.env.FRONTEND_REVALIDATION_SECRET) {
    return Response.json(
      { revalidated: false, message: 'Revalidation secret is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (!authorized(request)) {
    return Response.json(
      { revalidated: false, message: 'Unauthorized.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  revalidatePath('/')
  revalidatePath('/artikel')
  revalidatePath('/artikel/[slug]', 'page')

  return Response.json(
    { revalidated: true, paths: ['/', '/artikel', '/artikel/[slug]'] },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
