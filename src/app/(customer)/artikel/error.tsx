'use client'

import Link from 'next/link'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default function ArtikelError({ unstable_retry }: { unstable_retry: () => void }) {
    return (
        <div className="c-app flex min-h-[55vh] items-center justify-center py-14">
            <section className="w-full max-w-xl rounded-3xl border border-sr-navy/10 bg-white p-7 text-center shadow-[0_16px_50px_rgba(27,58,107,0.08)] sm:p-10" aria-labelledby="article-error-heading">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sr-red/10 text-sr-red" aria-hidden="true">
                    <AlertCircle size={28} />
                </span>
                <p className="section-eyebrow mt-5">Terjadi kendala</p>
                <h1 id="article-error-heading" className="mt-2 text-3xl font-bold text-sr-navy sm:text-4xl">
                    Artikel belum dapat dibuka
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-sr-gray sm:text-base">
                    Koneksi ke layanan artikel sedang terganggu. Coba muat kembali atau kembali ke daftar artikel.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={() => unstable_retry()} className="c-btn c-btn-primary c-btn-lg">
                        <RotateCcw size={16} aria-hidden="true" /> Coba lagi
                    </button>
                    <Link href="/artikel" className="c-btn c-btn-outline c-btn-lg">
                        Daftar artikel
                    </Link>
                </div>
            </section>
        </div>
    )
}
