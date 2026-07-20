'use client'

import {
  allocatedPreparationQuantity,
  isPreparationAllocationComplete,
  normalizePreparationAllocation,
  type PreparationAllocation,
} from '@/lib/preparation'
import { getPreparationMethods, type CartItem } from '@/stores/cart.store'
import type { PreparationMethod } from '@/types'
import { Check, Flame, Snowflake, Soup } from 'lucide-react'

const OPTIONS: Array<{
  value: PreparationMethod
  label: string
  description: string
  Icon: typeof Snowflake
}> = [
  { value: 'frozen', label: 'Frozen', description: 'Siap disimpan', Icon: Snowflake },
  { value: 'kukus', label: 'Kukus', description: 'Hangat & lembut', Icon: Soup },
  { value: 'goreng', label: 'Goreng', description: 'Garing siap makan', Icon: Flame },
]

interface Props {
  items: CartItem[]
  values: Record<string, PreparationAllocation>
  onChange: (productId: string, allocation: PreparationAllocation) => void
}

export default function PreparationOptions({ items, values, onChange }: Props) {
  const completed = items.filter(item => isPreparationAllocationComplete(item, values[item.id])).length

  function setAll(item: CartItem, method: PreparationMethod) {
    onChange(item.id, { [method]: item.qty })
  }

  function setQuantity(item: CartItem, method: PreparationMethod, quantity: number) {
    const current = normalizePreparationAllocation(item, values[item.id])
    const next = { ...current, [method]: Math.max(0, quantity) }
    if (next[method] === 0) delete next[method]
    onChange(item.id, next)
  }

  return (
    <section className="preparation-card" aria-labelledby="preparation-title">
      <div className="preparation-stepper" aria-label="Progres pengiriman instant">
        <span className="preparation-step preparation-step--complete"><Check size={13} /> Kurir instant</span>
        <span className="preparation-stepper__line" aria-hidden="true" />
        <span className="preparation-step preparation-step--active">2 Pilih olahan</span>
      </div>

      <div className="preparation-heading">
        <div>
          <p className="preparation-eyebrow">GRATIS MASAK</p>
          <h3 id="preparation-title">Mau disiapkan bagaimana?</h3>
          <p>Pilih satu olahan untuk setiap produk sebelum lanjut.</p>
        </div>
        <span className="preparation-progress">{completed}/{items.length}</span>
      </div>

      <div className="preparation-products">
        {items.map((item, index) => {
          const availableMethods = getPreparationMethods(item)
          const availableOptions = OPTIONS.filter(option => availableMethods.includes(option.value))
          const isAutomatic = availableOptions.length === 1
          const allocation = normalizePreparationAllocation(item, values[item.id])
          const allocated = allocatedPreparationQuantity(allocation)
          const isSinglePortion = item.qty === 1

          return (
            <fieldset className="preparation-product" key={item.id}>
            <legend>
              <span>{index + 1}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.qty} porsi{isAutomatic ? ' · otomatis dipilih' : ` · ${allocated}/${item.qty} sudah diatur`}</small>
              </span>
            </legend>

            {!isSinglePortion && !isAutomatic && (
              <div className="preparation-quick-actions" aria-label={`Pilihan cepat untuk ${item.name}`}>
                <span>Pilih cepat:</span>
                {availableOptions.map(({ value, label }) => (
                  <button type="button" key={value} onClick={() => setAll(item, value)}>
                    Semua {label}
                  </button>
                ))}
              </div>
            )}

            <div className={`${isSinglePortion ? 'preparation-options' : 'preparation-allocation'}${isSinglePortion ? ` preparation-options--${availableOptions.length}` : ''}`}>
              {availableOptions.map(({ value, label, description, Icon }) => {
                const quantity = allocation[value] ?? 0
                const selected = quantity > 0

                return isSinglePortion ? (
                  <label key={value} className={`preparation-option${selected ? ' preparation-option--selected' : ''}`}>
                    <input
                      type="radio"
                      name={`preparation_${item.branchId}_${item.id}`}
                      value={value}
                      checked={selected}
                      disabled={isAutomatic}
                      onChange={() => setAll(item, value)}
                    />
                    <span className="preparation-option__icon"><Icon size={18} strokeWidth={1.8} /></span>
                    <span className="preparation-option__copy">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    {selected && <Check className="preparation-option__check" size={15} strokeWidth={3} />}
                  </label>
                ) : (
                  <div key={value} className={`preparation-allocation__row${selected ? ' preparation-allocation__row--selected' : ''}`}>
                    <span className="preparation-option__icon"><Icon size={18} strokeWidth={1.8} /></span>
                    <span className="preparation-option__copy">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <div className="preparation-quantity" aria-label={`Jumlah ${item.name} ${label}`}>
                      <button
                        type="button"
                        disabled={quantity === 0 || isAutomatic}
                        aria-label={`Kurangi ${label}`}
                        onClick={() => setQuantity(item, value, quantity - 1)}
                      >−</button>
                      <output aria-live="polite">{quantity}</output>
                      <button
                        type="button"
                        disabled={allocated >= item.qty || isAutomatic}
                        aria-label={`Tambah ${label}`}
                        onClick={() => setQuantity(item, value, quantity + 1)}
                      >+</button>
                    </div>
                  </div>
                )
              })}
            </div>

            {!isSinglePortion && !isAutomatic && (
              <p className={`preparation-allocation__status${allocated === item.qty ? ' preparation-allocation__status--complete' : ''}`}>
                {allocated === item.qty
                  ? `✓ Semua ${item.qty} porsi sudah diatur`
                  : `Pilih olahan untuk ${item.qty - allocated} porsi lagi`}
              </p>
            )}
            </fieldset>
          )
        })}
      </div>
    </section>
  )
}
