'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
    src?: string
    alt: string
    sizes: string
    variant?: 'hero' | 'card'
    priority?: boolean
}

export default function ArticleMedia({ src, alt, sizes, variant = 'card', priority = false }: Props) {
    const [failed, setFailed] = useState(false)

    const placeholder = variant === 'hero' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-sr-navy px-6 text-center text-white/70">
            <span className="section-eyebrow !text-sr-gold-l">Cerita Seraso</span>
            <span className="font-display mt-2 max-w-full text-2xl font-bold leading-tight sm:text-4xl">Rasa yang punya cerita</span>
        </div>
    ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-sr-cream-d font-display text-xl font-bold text-sr-navy/40">
            SERASO
        </div>
    )

    if (src && !failed) {
        return (
            <>
                {placeholder}
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes={sizes}
                    className={variant === 'hero'
                        ? 'z-[1] object-cover'
                        : 'z-[1] object-cover transition-transform duration-500 group-hover:scale-105'}
                    priority={priority}
                    onError={() => setFailed(true)}
                    unoptimized
                />
            </>
        )
    }

    return placeholder
}
