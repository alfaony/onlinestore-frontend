import { NextRequest, NextResponse } from 'next/server'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'
const ADMIN_BOUNDARY_URL = 'https://wilayah-id-restapi.vercel.app/api/v1/boundaries/reverse'

interface BoundaryResponse {
  data?: {
    provinsi?: { kode_prov?: string; nama_provinsi?: string }
    kabupaten?: { kode_kab?: string; nama_kabupaten?: string }
    kecamatan?: { kode_kec?: string; nama_kecamatan?: string }
    desa?: { kode_desa?: string; nama_desa?: string; kode_pos?: string }
  }
}

export async function GET(request: NextRequest) {
  const latitude = Number(request.nextUrl.searchParams.get('lat'))
  const longitude = Number(request.nextUrl.searchParams.get('lng'))

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return NextResponse.json({ message: 'Koordinat tidak valid.' }, { status: 422 })
  }

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(latitude))
  url.searchParams.set('lon', String(longitude))
  url.searchParams.set('accept-language', 'id')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  const boundaryUrl = new URL(ADMIN_BOUNDARY_URL)
  boundaryUrl.searchParams.set('lat', String(latitude))
  boundaryUrl.searchParams.set('lng', String(longitude))

  try {
    const [nominatimResult, boundaryResult] = await Promise.allSettled([
      fetch(url, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SerasoPalembang/1.0 (customer-address-geocoder)',
        },
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(boundaryUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      }),
    ])

    const nominatimAvailable = nominatimResult.status === 'fulfilled' && nominatimResult.value.ok
    const boundaryAvailable = boundaryResult.status === 'fulfilled' && boundaryResult.value.ok

    if (!nominatimAvailable && !boundaryAvailable) {
      return NextResponse.json({ message: 'Layanan lokasi sedang tidak tersedia.' }, { status: 502 })
    }

    const geocoded = nominatimAvailable ? await nominatimResult.value.json() : {}
    const boundary: BoundaryResponse = boundaryAvailable
      ? await boundaryResult.value.json()
      : {}
    const admin = boundary.data

    return NextResponse.json({
      ...geocoded,
      administrative: admin ? {
        province: { code: admin.provinsi?.kode_prov, name: admin.provinsi?.nama_provinsi },
        regency: { code: admin.kabupaten?.kode_kab, name: admin.kabupaten?.nama_kabupaten },
        district: { code: admin.kecamatan?.kode_kec, name: admin.kecamatan?.nama_kecamatan },
        village: { code: admin.desa?.kode_desa, name: admin.desa?.nama_desa },
        postal_code: admin.desa?.kode_pos,
      } : null,
    })
  } catch {
    return NextResponse.json({ message: 'Gagal membaca detail lokasi.' }, { status: 502 })
  }
}
