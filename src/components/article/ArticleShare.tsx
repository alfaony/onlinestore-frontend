'use client'

import { Check, Copy, Send, Share2, ThumbsUp } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

interface Props {
    title: string
    description?: string | null
    compact?: boolean
}

export default function ArticleShare({ title, description, compact = false }: Props) {
    const copyStateRef = useRef<HTMLSpanElement>(null)

    const currentUrl = () => window.location.href

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl())
            toast.success('Tautan artikel berhasil disalin.')
            copyStateRef.current?.classList.add('article-share-copy-success')
            window.setTimeout(() => copyStateRef.current?.classList.remove('article-share-copy-success'), 1200)
        } catch {
            toast.error('Tautan belum berhasil disalin. Silakan coba kembali.')
        }
    }

    const nativeShare = async () => {
        if (!navigator.share) {
            await copyLink()
            return
        }

        try {
            await navigator.share({ title, text: description ?? undefined, url: currentUrl() })
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return
            toast.error('Artikel belum berhasil dibagikan.')
        }
    }

    const openShareWindow = (destination: 'whatsapp' | 'facebook') => {
        const url = encodeURIComponent(currentUrl())
        const text = encodeURIComponent(`${title}\n${currentUrl()}`)
        const shareUrl = destination === 'whatsapp'
            ? `https://wa.me/?text=${text}`
            : `https://www.facebook.com/sharer/sharer.php?u=${url}`
        window.open(shareUrl, '_blank', 'noopener,noreferrer')
    }

    const buttonClass = compact
        ? 'inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sr-navy/10 bg-white text-sr-navy transition-all hover:-translate-y-0.5 hover:border-sr-red/20 hover:text-sr-red'
        : 'inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-sr-navy/10 bg-white px-3 text-xs font-bold text-sr-navy transition-all hover:-translate-y-0.5 hover:border-sr-red/20 hover:text-sr-red sm:w-auto'

    return (
        <div className={compact ? 'flex flex-col items-center gap-2' : 'grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap'}>
            <button type="button" onClick={nativeShare} className={buttonClass} title="Bagikan artikel" aria-label={compact ? 'Bagikan artikel' : undefined}>
                <Share2 size={17} aria-hidden="true" />
                {!compact && <span>Bagikan</span>}
            </button>
            <button type="button" onClick={() => openShareWindow('whatsapp')} className={buttonClass} title="Bagikan ke WhatsApp" aria-label={compact ? 'Bagikan ke WhatsApp' : undefined}>
                <Send size={17} aria-hidden="true" />
                {!compact && <span>WhatsApp</span>}
            </button>
            <button type="button" onClick={() => openShareWindow('facebook')} className={buttonClass} title="Bagikan ke Facebook" aria-label={compact ? 'Bagikan ke Facebook' : undefined}>
                <ThumbsUp size={17} aria-hidden="true" />
                {!compact && <span>Facebook</span>}
            </button>
            <button type="button" onClick={copyLink} className={buttonClass} title="Salin tautan artikel" aria-label={compact ? 'Salin tautan artikel' : undefined}>
                <span ref={copyStateRef} className="relative inline-flex h-[17px] w-[17px] items-center justify-center">
                    <Copy size={17} aria-hidden="true" />
                    <Check size={17} aria-hidden="true" className="article-share-copy-check" />
                </span>
                {!compact && <span>Salin tautan</span>}
            </button>
        </div>
    )
}
