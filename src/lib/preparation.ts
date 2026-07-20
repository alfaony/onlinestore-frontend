import { getPreparationMethods, type CartItem } from '@/stores/cart.store'
import type { PreparationMethod } from '@/types'

export type PreparationAllocation = Partial<Record<PreparationMethod, number>>

export const PREPARATION_METHODS: PreparationMethod[] = ['frozen', 'kukus', 'goreng']

export const PREPARATION_LABELS: Record<PreparationMethod, string> = {
  frozen: 'Frozen',
  kukus: 'Kukus',
  goreng: 'Goreng',
}

export function allocatedPreparationQuantity(allocation?: PreparationAllocation): number {
  return PREPARATION_METHODS.reduce((total, method) => total + Math.max(0, allocation?.[method] ?? 0), 0)
}

export function normalizePreparationAllocation(
  item: CartItem,
  allocation?: PreparationAllocation,
): PreparationAllocation {
  const methods = getPreparationMethods(item)
  if (methods.length === 1) return { [methods[0]]: item.qty }

  let remaining = item.qty
  return Object.fromEntries(methods.flatMap(method => {
    const quantity = Math.min(remaining, Math.max(0, Math.floor(allocation?.[method] ?? 0)))
    remaining -= quantity
    return quantity > 0 ? [[method, quantity]] : []
  })) as PreparationAllocation
}

export function isPreparationAllocationComplete(
  item: CartItem,
  allocation?: PreparationAllocation,
): boolean {
  const available = new Set(getPreparationMethods(item))
  const hasInvalidMethod = PREPARATION_METHODS.some(method =>
    (allocation?.[method] ?? 0) > 0 && !available.has(method)
  )

  return !hasInvalidMethod && allocatedPreparationQuantity(allocation) === item.qty
}

export function preparationAllocationSummary(allocation?: PreparationAllocation): string {
  return PREPARATION_METHODS
    .filter(method => (allocation?.[method] ?? 0) > 0)
    .map(method => `${allocation?.[method]} ${PREPARATION_LABELS[method]}`)
    .join(' · ')
}
