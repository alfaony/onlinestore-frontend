import { NextResponse } from 'next/server'
import { fetchWilayah } from '@/lib/wilayah'

export async function GET() {
    const data = await fetchWilayah('provinces.json')
    return NextResponse.json(data)
}