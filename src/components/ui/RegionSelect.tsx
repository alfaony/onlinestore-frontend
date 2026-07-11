// src/components/ui/RegionSelect.tsx
'use client'
import Select, { type SingleValue, type StylesConfig } from 'react-select'
import type { Region } from '@/lib/addressWilayah'

const S = {
  red: '#C41E3A', creamDp: '#EDD9B8', gray: '#6B7280', grayL: '#F3F0EB', dark: '#1A1A2E',
}

interface Option { value: string; label: string }

const styles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: state.isFocused ? S.red : S.creamDp,
    boxShadow: state.isFocused ? '0 0 0 3px rgba(196, 30, 58, 0.08)' : 'none',
    background: state.isDisabled ? S.grayL : '#fff',
    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    ':hover': { borderColor: state.isFocused ? S.red : S.creamDp },
  }),
  valueContainer: base => ({ ...base, padding: '2px 14px' }),
  placeholder: base => ({ ...base, color: S.gray, fontSize: 13 }),
  singleValue: base => ({ ...base, color: S.dark, fontSize: 13 }),
  input: base => ({ ...base, color: S.dark, fontSize: 13 }),
  menu: base => ({ ...base, borderRadius: 10, overflow: 'hidden', zIndex: 20 }),
  option: (base, state) => ({
    ...base,
    fontSize: 13,
    background: state.isSelected ? S.red : state.isFocused ? 'rgba(196,30,58,0.06)' : '#fff',
    color: state.isSelected ? '#fff' : S.dark,
    cursor: 'pointer',
  }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: base => ({ ...base, color: S.gray, padding: '0 10px' }),
  loadingIndicator: base => ({ ...base, color: S.red }),
}

interface Props {
  name: string
  value: string
  onChange: (code: string) => void
  options: Region[]
  placeholder: string
  loading?: boolean
  disabled?: boolean
}

export default function RegionSelect({ name, value, onChange, options, placeholder, loading, disabled }: Props) {
  const opts: Option[] = options.map(o => ({ value: o.code, label: o.name }))
  // `value` bisa saja belum ada di daftar `opts` saat baru terisi otomatis
  // (mis. GPS baru match provinsi, daftar kota belum termuat) — fallback ke
  // null daripada crash, dropdown akan tampil kosong sampai daftarnya siap.
  const selected = opts.find(o => o.value === value) ?? null
  const isDisabled = Boolean(loading || disabled || !options.length)

  function handleChange(opt: SingleValue<Option>) {
    onChange(opt?.value ?? '')
  }

  return (
    <Select<Option, false>
      instanceId={name}
      inputId={name}
      styles={styles}
      options={opts}
      value={selected}
      onChange={handleChange}
      isDisabled={isDisabled}
      isLoading={Boolean(loading)}
      isClearable
      isSearchable
      placeholder={loading ? 'Memuat...' : placeholder}
      noOptionsMessage={() => 'Tidak ditemukan'}
      loadingMessage={() => 'Memuat...'}
    />
  )
}
