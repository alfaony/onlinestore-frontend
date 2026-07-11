// src/hooks/useWilayahCascade.ts
'use client'
import { useState } from 'react'
import {
  fetchWilayahClient, matchRegion,
  type Region, type GeocodedResult,
} from '@/lib/addressWilayah'

export type DetectLevel = 'village' | 'district' | 'regency' | 'province' | 'coordinates'

interface ResolveNames {
  province?: string
  regency?: string
  district?: string
  village?: string
}

/**
 * Cascade provinsi -> kota/kabupaten -> kecamatan -> kelurahan/desa,
 * plus pencocokan otomatis dari hasil reverse-geocode atau dari nama
 * yang sudah tersimpan (mode edit). Dipakai oleh form alamat checkout
 * dan halaman Alamat Saya supaya perilakunya konsisten.
 */
export function useWilayahCascade() {
  const [provinces, setProvinces] = useState<Region[]>([])
  const [regencies, setRegencies] = useState<Region[]>([])
  const [districts, setDistricts] = useState<Region[]>([])
  const [villages,  setVillages]  = useState<Region[]>([])
  const [loadP, setLoadP] = useState(false)
  const [loadR, setLoadR] = useState(false)
  const [loadD, setLoadD] = useState(false)
  const [loadV, setLoadV] = useState(false)

  const [province, setProvince] = useState<Region | null>(null)
  const [regency,  setRegency]  = useState<Region | null>(null)
  const [district, setDistrict] = useState<Region | null>(null)
  const [village,  setVillage]  = useState<Region | null>(null)

  async function loadProvinces() {
    if (provinces.length) return provinces
    setLoadP(true)
    const result = await fetchWilayahClient('provinces')
    setProvinces(result)
    setLoadP(false)
    return result
  }

  async function onProvince(code: string) {
    const p = provinces.find(x => x.code === code) ?? null
    setProvince(p); setRegency(null); setDistrict(null); setVillage(null)
    setRegencies([]); setDistricts([]); setVillages([])
    if (!code) return
    setLoadR(true)
    const list = await fetchWilayahClient(`regencies/${code}`)
    setRegencies(list)
    setLoadR(false)
  }

  async function onRegency(code: string) {
    const r = regencies.find(x => x.code === code) ?? null
    setRegency(r); setDistrict(null); setVillage(null)
    setDistricts([]); setVillages([])
    if (!code) return
    setLoadD(true)
    const list = await fetchWilayahClient(`districts/${code}`)
    setDistricts(list)
    setLoadD(false)
  }

  async function onDistrict(code: string) {
    const d = districts.find(x => x.code === code) ?? null
    setDistrict(d); setVillage(null); setVillages([])
    if (!code) return
    setLoadV(true)
    const list = await fetchWilayahClient(`villages/${code}`)
    setVillages(list)
    setLoadV(false)
  }

  function onVillage(code: string) {
    setVillage(villages.find(x => x.code === code) ?? null)
  }

  // Cascade generik: cari region tiap level dari kode/kandidat nama,
  // lalu muat daftar level berikutnya. Dipakai baik untuk hasil
  // reverse-geocode (GPS) maupun untuk resolve nama tersimpan (edit).
  async function resolveCascade(input: {
    provinceCode?: string;  provinceCandidates: Array<string | undefined>
    regencyCode?: string;   regencyCandidates: Array<string | undefined>
    districtCode?: string;  districtCandidates: Array<string | undefined>
    villageCode?: string;   villageCandidates: Array<string | undefined>
  }): Promise<{ level: DetectLevel }> {
    let provinceList = provinces
    if (!provinceList.length) provinceList = await loadProvinces()

    const matchedProvince = matchRegion(provinceList, input.provinceCode, input.provinceCandidates)
    if (!matchedProvince) return { level: 'coordinates' }
    setProvince(matchedProvince)
    setRegency(null); setDistrict(null); setVillage(null)

    setLoadR(true)
    const regencyList = await fetchWilayahClient(`regencies/${matchedProvince.code}`)
    setRegencies(regencyList)
    setLoadR(false)
    const matchedRegency = matchRegion(regencyList, input.regencyCode, input.regencyCandidates)
    if (!matchedRegency) return { level: 'province' }
    setRegency(matchedRegency)

    setLoadD(true)
    const districtList = await fetchWilayahClient(`districts/${matchedRegency.code}`)
    setDistricts(districtList)
    setLoadD(false)
    const matchedDistrict = matchRegion(districtList, input.districtCode, input.districtCandidates)
    if (!matchedDistrict) return { level: 'regency' }
    setDistrict(matchedDistrict)

    setLoadV(true)
    const villageList = await fetchWilayahClient(`villages/${matchedDistrict.code}`)
    setVillages(villageList)
    setLoadV(false)
    const matchedVillage = matchRegion(villageList, input.villageCode, input.villageCandidates)
    setVillage(matchedVillage)

    return { level: matchedVillage ? 'village' : 'district' }
  }

  /** Terapkan hasil reverse-geocode (dipanggil saat "Gunakan Lokasi Saat Ini" / drag pin). */
  async function applyGeocoded(geocoded: GeocodedResult) {
    const address = geocoded.address ?? {}
    const administrative = geocoded.administrative

    const { level } = await resolveCascade({
      provinceCode: administrative?.province?.code,
      provinceCandidates: [administrative?.province?.name, address.state, address.province],
      regencyCode: administrative?.regency?.code,
      regencyCandidates: [
        administrative?.regency?.name, address.city, address.town,
        address.municipality, address.state_district, address.county,
      ],
      districtCode: administrative?.district?.code,
      districtCandidates: [
        administrative?.district?.name, address.city_district,
        address.district, address.suburb,
      ],
      villageCode: administrative?.village?.code,
      villageCandidates: [
        administrative?.village?.name, address.village,
        address.neighbourhood, address.quarter, address.hamlet, address.suburb,
      ],
    })

    const road = [address.road ?? address.pedestrian, address.house_number].filter(Boolean).join(' ')
    const postalCode = administrative?.postal_code ?? address.postcode

    return { level, street: road || undefined, postalCode: postalCode || undefined }
  }

  /**
   * Resolve nama wilayah yang sudah tersimpan (mis. saat edit alamat, hanya
   * nama yang ada, tanpa kode) menjadi Region beserta kode aslinya, supaya
   * dropdown pencarian bisa menampilkan pilihan yang benar-benar cocok.
   */
  async function resolveFromNames(names: ResolveNames) {
    if (!names.province) return { level: 'coordinates' as DetectLevel }
    return resolveCascade({
      provinceCandidates: [names.province],
      regencyCandidates: [names.regency],
      districtCandidates: [names.district],
      villageCandidates: [names.village],
    })
  }

  return {
    provinces, regencies, districts, villages,
    loadP, loadR, loadD, loadV,
    province, regency, district, village,
    setProvince, setRegency, setDistrict, setVillage,
    onProvince, onRegency, onDistrict, onVillage,
    loadProvinces, applyGeocoded, resolveFromNames,
  }
}

/** Wrapper geolocation browser -> reverse-geocode, dengan penanganan error yang konsisten. */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported')); return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000,
    })
  })
}

export { reverseGeocode } from '@/lib/addressWilayah'
export type { Region, GeocodedResult } from '@/lib/addressWilayah'
