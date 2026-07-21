import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'

export default function ArtikelNotFound() {
    return (
        <div className="c-app flex min-h-[55vh] items-center justify-center py-14">
            <section className="w-full max-w-xl rounded-3xl border border-sr-navy/10 bg-white p-7 text-center shadow-[0_16px_50px_rgba(27,58,107,0.08)] sm:p-10" aria-labelledby="article-not-found-heading">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sr-gold/15 text-sr-navy" aria-hidden="true">
                    <FileQuestion size={28} />
                </span>
                <p className="section-eyebrow mt-5">Artikel tidak ditemukan</p>
                <h1 id="article-not-found-heading" className="mt-2 text-3xl font-bold text-sr-navy sm:text-4xl">
                    Cerita ini tidak tersedia
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-sr-gray sm:text-base">
                    Tautannya mungkin telah berubah atau artikelnya sudah tidak dipublikasikan.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <Link href="/artikel" className="c-btn c-btn-primary c-btn-lg">
                        <ArrowLeft size={16} aria-hidden="true" /> Kembali ke artikel
                    </Link>
                    <Link href="/" className="c-btn c-btn-outline c-btn-lg">
                        Ke beranda
                    </Link>
                </div>
            </section>
        </div>
    )
}
