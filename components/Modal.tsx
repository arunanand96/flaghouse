'use client'

import { useEffect } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export function Modal({ title, onClose, children, width = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    // Mobile: items-end (bottom sheet). sm+: items-center (centered dialog)
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`neu modal-sheet w-full ${width} p-5 sm:p-6 flex flex-col gap-5`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-1)' }}>
            {title}
          </h2>
          <button
            className="neu-btn neu-btn-sm w-8 h-8 flex items-center justify-center p-0"
            style={{ color: 'var(--text-3)', fontSize: '1.1rem' }}
            onClick={onClose}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
