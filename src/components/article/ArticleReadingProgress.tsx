'use client'

import { useEffect, useRef } from 'react'

export default function ArticleReadingProgress({ targetId }: { targetId: string }) {
    const progressRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const updateProgress = () => {
            const target = document.getElementById(targetId)
            const progress = progressRef.current
            if (!target || !progress) return

            const start = target.offsetTop
            const distance = Math.max(target.offsetHeight - window.innerHeight, 1)
            const percentage = Math.min(Math.max((window.scrollY - start) / distance, 0), 1)
            progress.style.transform = `scaleX(${percentage})`
        }

        updateProgress()
        window.addEventListener('scroll', updateProgress, { passive: true })
        window.addEventListener('resize', updateProgress)

        return () => {
            window.removeEventListener('scroll', updateProgress)
            window.removeEventListener('resize', updateProgress)
        }
    }, [targetId])

    return (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]" aria-hidden="true">
            <div
                ref={progressRef}
                className="h-full origin-left scale-x-0 bg-sr-red motion-safe:transition-transform motion-safe:duration-100"
            />
        </div>
    )
}
