const BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api'

export interface Region { code: string; name: string }

interface RegionResponse {
  id?: string | number
  code?: string | number
  name?: string
}

export async function fetchWilayah(path: string): Promise<Region[]> {
  const res  = await fetch(`${BASE}/${path}`, { next: { revalidate: 86400 } })
  if (!res.ok) return []
  const json: unknown = await res.json()
  const list: RegionResponse[] = Array.isArray(json)
    ? json
    : json && typeof json === 'object' && 'data' in json && Array.isArray(json.data)
      ? json.data
      : []
  return list.map(r => ({
    code: String(r.id ?? r.code ?? ''),
    name: String(r.name ?? ''),
  }))
}
