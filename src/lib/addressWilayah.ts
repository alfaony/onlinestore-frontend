// src/lib/addressWilayah.ts
// Helper client-side untuk cascade wilayah (provinsi/kota/kecamatan/kelurahan)
// dan pencocokan hasil reverse-geocode ke data wilayah — dipakai bersama oleh
// form alamat checkout (order) dan halaman Alamat Saya, supaya perilaku
// "Gunakan Lokasi Saat Ini" konsisten dan tidak duplikat logic.
import type { Region } from './wilayah'

export type { Region }

export interface GeocodedAddress {
  road?: string
  pedestrian?: string
  house_number?: string
  postcode?: string
  state?: string
  province?: string
  city?: string
  town?: string
  municipality?: string
  county?: string
  state_district?: string
  city_district?: string
  district?: string
  suburb?: string
  village?: string
  neighbourhood?: string
  quarter?: string
  hamlet?: string
}

export interface GeocodedResult {
  address?: GeocodedAddress
  display_name?: string
  administrative?: {
    province?: { code?: string; name?: string }
    regency?: { code?: string; name?: string }
    district?: { code?: string; name?: string }
    village?: { code?: string; name?: string }
    postal_code?: string
  } | null
}

export async function fetchWilayahClient(path: string): Promise<Region[]> {
  try {
    const res = await fetch(`/api/wilayah/${path}`)
    if (!res.ok) return []
    return res.json()
  } catch { return [] }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedResult> {
  const response = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`)
  if (!response.ok) throw new Error('Reverse geocoding gagal')
  return response.json()
}

function normalizeRegionName(str: string) {
  return str.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(provinsi|kota|kabupaten|kab|kecamatan|kec|kelurahan|kel|desa)\b\.?/gi, '')
    .replace(/\b(satu|pertama)\b/g, 'i')
    .replace(/\b(dua|kedua)\b/g, 'ii')
    .replace(/\b(tiga|ketiga)\b/g, 'iii')
    .replace(/\b(empat|keempat)\b/g, 'iv')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchRegionCandidates(list: Region[], candidates: Array<string | undefined>): Region | null {
  const queries = candidates.map(value => normalizeRegionName(value ?? '')).filter(Boolean)
  if (!queries.length) return null

  const scored = list.map(region => {
    const name = normalizeRegionName(region.name)
    const score = Math.max(...queries.map(query => {
      if (name === query) return 100
      if (name.replace(/\s/g, '') === query.replace(/\s/g, '')) return 95
      if (name.startsWith(query) || query.startsWith(name)) return 80
      if (name.includes(query) || query.includes(name)) return 60

      const nameWords = new Set(name.split(' '))
      const queryWords = query.split(' ')
      const overlap = queryWords.filter(word => nameWords.has(word)).length
      return overlap ? (overlap / Math.max(nameWords.size, queryWords.length)) * 40 : 0
    }))

    return { region, score }
  }).sort((left, right) => right.score - left.score)

  return scored[0]?.score >= 35 ? scored[0].region : null
}

export function matchRegion(list: Region[], code: string | undefined, candidates: Array<string | undefined>) {
  const normalizedCode = code?.replace(/\D/g, '')
  if (normalizedCode) {
    const codeMatch = list.find(region => region.code.replace(/\D/g, '') === normalizedCode)
    if (codeMatch) return codeMatch
  }

  return matchRegionCandidates(list, candidates)
}
