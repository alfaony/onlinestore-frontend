'use client'

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  titleId: string
  children: ReactNode
  maxWidth?: number
  mobileSheet?: boolean
}

export default function Modal({ open, onClose, titleId, children, maxWidth = 420, mobileSheet = false }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus()
    }
  }, [open])

  if (!open) return null

  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div
      className={`c-modal-layer animate-fade-in${mobileSheet ? ' c-modal-layer--mobile-sheet' : ''}`}
      onMouseDown={closeFromBackdrop}
    >
      <section
        ref={panelRef}
        className={`c-modal-panel animate-modal-in${mobileSheet ? ' c-modal-panel--mobile-sheet' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ maxWidth }}
      >
        {children}
      </section>
    </div>
  )
}
