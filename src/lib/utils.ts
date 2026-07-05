// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
}

export function storageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
    .replace(/\/api$/, '')
  return `${base}/storage/${path}`
}

export function generateOrderNumber(): string {
  return 'SRS-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000)
}

export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

export function toArray<T>(val: unknown): T[] {
  if (Array.isArray(val)) return val as T[]
  if (val && typeof val === 'object' && 'data' in val && Array.isArray(val.data)) {
    return val.data as T[]
  }
  return []
}
