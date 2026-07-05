import type { Branch } from '@/types'
import { Clock3, MapPin, Phone } from 'lucide-react'

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
    <section className="c-app section-pad">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <p className="section-eyebrow mb-3">
          Lokasi Kami
        </p>
        <h2 className="section-title">
          Temukan Seraso terdekat
        </h2>
        <p className="section-copy mx-auto mt-4">Kami hadir lebih dekat agar pesananmu diproses dan dikirim lebih cepat.</p>
      </div>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-2">
        {displayBranches.map(b => (
          <div key={b.id} className="c-card flex gap-4 p-6">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sr-red/10 text-sr-red">
              <MapPin size={21} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-[20px] font-semibold text-sr-navy mb-1">
                {b.name}
              </h3>
              <p className="mb-2 flex items-start gap-1.5 text-xs leading-5 text-sr-gray"><MapPin size={13} className="mt-0.5 shrink-0" /> {b.address}</p>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-sr-red"><Phone size={13} /> {b.phone}</p>
              {'hours' in b && Boolean((b as Record<string, unknown>).hours) && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-sr-gray"><Clock3 size={12} /> {String((b as Record<string, unknown>).hours)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
