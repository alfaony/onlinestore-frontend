// frontend/src/components/checkout/AddressForm.tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { Member, MemberAddress } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Plus } from 'lucide-react'
import api from '@/lib/api'
import { useMemberStore } from '@/stores/member.store'

interface Props {
    onSelect: (address: any) => void
    member: Member | null
}

export default function AddressForm({ onSelect, member }: Props) {
    const token = useMemberStore(s => s.token)
    const [addresses, setAddresses] = useState<MemberAddress[]>([])
    const [selected, setSelected] = useState<string | null>(null)
    const [showNew, setShowNew] = useState(false)
    const [newAddress, setNewAddress] = useState({
        label: '', address: '', detail: '',
        latitude: null as number | null,
        longitude: null as number | null,
    })
    const inputRef = useRef<HTMLInputElement>(null)

    // Load saved addresses jika member
    useEffect(() => {
        if (!member || !token) return
        api.get('/member/addresses', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            setAddresses(r.data)
            // Auto-select default
            const def = r.data.find((a: MemberAddress) => a.is_default)
            if (def) { setSelected(def.id); onSelect(def) }
        })
    }, [member])

    // Google Maps Autocomplete
    useEffect(() => {
        if (!showNew || !inputRef.current) return
        if (!window.google) return

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'id' },
            fields: ['formatted_address', 'geometry'],
        })

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            if (!place.geometry) return
            setNewAddress(prev => ({
                ...prev,
                address: place.formatted_address ?? '',
                latitude: place.geometry!.location!.lat(),
                longitude: place.geometry!.location!.lng(),
            }))
        })
    }, [showNew])

    async function saveAndUseAddress() {
        if (!newAddress.address || !newAddress.latitude) return

        if (member && token) {
            // Simpan ke member addresses
            const { data } = await api.post('/member/addresses', {
                ...newAddress, is_default: addresses.length === 0
            }, { headers: { Authorization: `Bearer ${token}` } })
            setAddresses(prev => [...prev, data])
            handleSelect(data)
        } else {
            // Guest — langsung pakai tanpa simpan
            handleSelect(newAddress)
        }
        setShowNew(false)
    }

    function handleSelect(addr: any) {
        setSelected(addr.id ?? 'new')
        onSelect(addr)
    }

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Alamat Pengiriman</h2>

            {/* Saved Addresses */}
            {addresses.length > 0 && (
                <div className="space-y-2 mb-4">
                    {addresses.map(addr => (
                        <button key={addr.id}
                            className={`w-full text-left p-3 rounded-xl border transition-all
                ${selected === addr.id
                                    ? 'border-[--color-primary] bg-red-50'
                                    : 'border-gray-200 hover:border-amber-200'}`}
                            onClick={() => handleSelect(addr)}>
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-[--color-primary] mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm text-gray-800">{addr.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{addr.address}</p>
                                    {addr.detail && (
                                        <p className="text-xs text-gray-400">{addr.detail}</p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* New Address Form */}
            {showNew ? (
                <div className="space-y-3 border border-dashed border-amber-200 rounded-xl p-4">
                    <div>
                        <Label>Label Alamat</Label>
                        <Input className="mt-1" placeholder="Rumah / Kantor / dll"
                            value={newAddress.label}
                            onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))} />
                    </div>
                    <div>
                        <Label>Cari Alamat</Label>
                        <div className="relative mt-1">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input ref={inputRef} className="pl-9"
                                placeholder="Ketik nama jalan atau area..."
                                value={newAddress.address}
                                onChange={e => setNewAddress(p => ({ ...p, address: e.target.value }))} />
                        </div>
                        {newAddress.latitude && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ Lokasi terdeteksi
                            </p>
                        )}
                    </div>
                    <div>
                        <Label>Detail (opsional)</Label>
                        <Input className="mt-1" placeholder="No. rumah, lantai, patokan..."
                            value={newAddress.detail}
                            onChange={e => setNewAddress(p => ({ ...p, detail: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1"
                            onClick={() => setShowNew(false)}>
                            Batal
                        </Button>
                        <Button className="flex-1 bg-[--color-primary] text-white"
                            onClick={saveAndUseAddress}
                            disabled={!newAddress.address || !newAddress.latitude}>
                            Gunakan Alamat Ini
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    className="flex items-center gap-2 text-sm text-[--color-primary] font-medium
            hover:text-[--color-primary-dark] transition-colors"
                    onClick={() => setShowNew(true)}>
                    <Plus className="w-4 h-4" />
                    {addresses.length > 0 ? 'Tambah Alamat Baru' : 'Masukkan Alamat Pengiriman'}
                </button>
            )}
        </div>
    )
}