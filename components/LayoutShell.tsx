'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change (mobile nav)
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div
  className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
>
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div
          className="flex md:hidden items-center gap-3 px-4 py-3 sticky top-0 z-30"
          style={{
            background: 'var(--bg)',
            boxShadow: '0 2px 10px var(--shadow-d)',
          }}
        >
          <button
            className="neu-btn neu-btn-sm w-9 h-9 p-0 flex items-center justify-center"
            style={{ color: 'var(--text-2)' }}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-bold text-base" style={{ color: 'var(--accent)' }}>
            🏠 FlagHouse
          </span>
        </div>

        {/* Desktop separator */}
        <div
          className="hidden md:block fixed left-56 top-0 bottom-0 w-px pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--shadow-d) 20%, var(--shadow-d) 80%, transparent)',
            opacity: 0.6,
          }}
        />

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-7">
          {children}
        </main>
      </div>
    </div>
  )
}
