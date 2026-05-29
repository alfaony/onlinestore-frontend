import { NextResponse } from 'next/server'
import { fetchWilayah } from '@/lib/wilayah'

export async function GET(
    _: Request,
    { params }: { params: Promise<{ code: string }> }
) {
    const { code } = await params
    const data = await fetchWilayah(`districts/${code}.json`)
    return NextResponse.json(data)
}