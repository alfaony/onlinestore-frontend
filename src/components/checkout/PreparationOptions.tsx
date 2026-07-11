'use client'

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
  values: Record<string, PreparationMethod>
  onChange: (productId: string, method: PreparationMethod) => void
}

export default function PreparationOptions({ items, values, onChange }: Props) {
  const completed = items.filter(item => getPreparationMethods(item).includes(values[item.id])).length

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

          return (
            <fieldset className="preparation-product" key={item.id}>
            <legend>
              <span>{index + 1}</span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.qty} porsi{isAutomatic ? ' · otomatis dipilih' : ''}</small>
              </span>
            </legend>

            <div className={`preparation-options preparation-options--${availableOptions.length}`}>
              {availableOptions.map(({ value, label, description, Icon }) => {
                const selected = values[item.id] === value

                return (
                  <label key={value} className={`preparation-option${selected ? ' preparation-option--selected' : ''}`}>
                    <input
                      type="radio"
                      name={`preparation_${item.branchId}_${item.id}`}
                      value={value}
                      checked={selected}
                      disabled={isAutomatic}
                      onChange={() => onChange(item.id, value)}
                    />
                    <span className="preparation-option__icon"><Icon size={18} strokeWidth={1.8} /></span>
                    <span className="preparation-option__copy">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    {selected && <Check className="preparation-option__check" size={15} strokeWidth={3} />}
                  </label>
                )
              })}
            </div>
            </fieldset>
          )
        })}
      </div>
    </section>
  )
}
