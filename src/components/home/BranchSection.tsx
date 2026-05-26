import type { Branch } from '@/types'

const DUMMY_BRANCHES: Branch[] = [
  {
    id: 'dummy-b1',
    name: 'Seraso Palembang Pusat',
    address: 'Jl. Sudirman No. 88, Ilir Timur I, Palembang',
    phone: '0711-123456',
    latitude: null,
    longitude: null,
  },
  {
    id: 'dummy-b2',
    name: 'Seraso Palembang Selatan',
    address: 'Jl. Demang Lebar Daun No. 15, Ilir Barat I, Palembang',
    phone: '0711-654321',
    latitude: null,
    longitude: null,
  },
]

export default function BranchSection({ branches }: { branches: Branch[] }) {
  const displayBranches = branches.length > 0 ? branches : DUMMY_BRANCHES

  return (
    <section className="c-app py-14 md:py-16">
      <div className="text-center mb-10">
        <p className="text-sr-gold text-[10px] font-bold tracking-[3px] uppercase mb-1.5">
          Lokasi Kami
        </p>
        <h2 className="font-display text-[38px] font-bold text-sr-navy">
          Cabang Seraso
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayBranches.map(b => (
          <div key={b.id} className="c-card p-6 flex gap-4">
            <div className="w-12 h-12 bg-sr-red/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
              📍
            </div>
            <div>
              <h3 className="font-display text-[20px] font-semibold text-sr-navy mb-1">
                {b.name}
              </h3>
              <p className="text-xs text-sr-gray mb-1">📍 {b.address}</p>
              <p className="text-xs text-sr-red font-medium">☎ {b.phone}</p>
              {'hours' in b && Boolean((b as Record<string, unknown>).hours) && (
                <p className="text-[11px] text-sr-gray mt-1">🕐 {String((b as Record<string, unknown>).hours)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
