const BASE = 'https://emsifa.github.io/api-wilayah-indonesia/api'

export interface Region { code: string; name: string }

export async function fetchWilayah(path: string): Promise<Region[]> {
  const res  = await fetch(`${BASE}/${path}`, { next: { revalidate: 86400 } })
  if (!res.ok) return []
  const json = await res.json()
  const list = Array.isArray(json) ? json : (json.data ?? [])
  return list.map((r: any) => ({
    code: String(r.id ?? r.code ?? ''),
    name: String(r.name ?? ''),
  }))
}