import { fetchWilayah } from '@/lib/wilayah'
import { NextResponse } from 'next/server'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const data = await fetchWilayah(`regencies/${code}.json`)
  return NextResponse.json(data)
}