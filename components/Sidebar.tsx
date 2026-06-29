'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'

interface House {
  id: string
  name: string
  _count: { briefs: number }
}

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme, isAuto, resetToAuto } = useTheme()
  const [houses, setHouses] = useState<House[]>([])
  const [showNewHouse, setShowNewHouse] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const loadHouses = async () => {
    const res = await fetch('/api/houses')
    if (res.ok) setHouses(await res.json())
  }

  useEffect(() => { loadHouses() }, [pathname])

  const createHouse = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/houses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (res.ok) {
      const h = await res.json()
      setNewName('')
      setShowNewHouse(false)
      setSaving(false)
      await loadHouses()
      router.push(`/houses/${h.id}`)
      onClose?.()
    }
  }

  const activeHouseId = pathname.match(/\/houses\/([^/]+)/)?.[1]

  return (
    <aside
      className="w-56 h-screen flex flex-col py-5 px-3 gap-3 overflow-y-auto"
      style={{ background: 'var(--bg)' }}
    >
      {/* Brand + mobile close */}
      <div className="flex items-center justify-between px-3 pt-1 pb-2">
        <span className="text-base font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
          🏠 FlagHouse
        </span>
        {onClose && (
          <button
            className="md:hidden neu-btn neu-btn-sm w-7 h-7 p-0 flex items-center justify-center"
            style={{ color: 'var(--text-3)' }}
            onClick={onClose}
            aria-label="Close menu"
          >
            ×
          </button>
        )}
      </div>

      {/* Houses */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-2 mb-0.5">
          <span className="label text-xs">Houses</span>
          <button
            className="text-xs font-semibold"
            style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setShowNewHouse(v => !v)}
          >+</button>
        </div>

        {showNewHouse && (
          <div className="flex gap-1 px-1">
            <input
              className="neu-input text-xs py-1.5 flex-1"
              placeholder="House name"
              value={newName}
              autoFocus
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createHouse()
                if (e.key === 'Escape') { setShowNewHouse(false); setNewName('') }
              }}
            />
            <button
              className="neu-btn neu-btn-sm px-2"
              style={{ color: 'var(--accent)' }}
              onClick={createHouse}
              disabled={saving || !newName.trim()}
            >↵</button>
          </div>
        )}

        {houses.length === 0 && !showNewHouse && (
          <p className="text-xs px-2 py-1" style={{ color: 'var(--text-muted)' }}>No houses yet</p>
        )}

        {houses.map(h => {
          const active = activeHouseId === h.id
          return (
            <Link
              key={h.id}
              href={`/houses/${h.id}`}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                textDecoration: 'none',
                color: active ? 'var(--accent)' : 'var(--text-2)',
                background: 'var(--bg)',
                boxShadow: active
                  ? '4px 4px 10px var(--shadow-d), -4px -4px 10px var(--shadow-l)'
                  : 'none',
                transition: 'box-shadow 0.15s',
              }}
            >
              <span className="truncate">{h.name}</span>
              <span className="text-xs ml-1 shrink-0" style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}>
                {h._count.briefs}
              </span>
            </Link>
          )
        })}
      </div>

      <div className="flex-1" />

      {/* Open Flags */}
      <Link
        href="/flags"
        onClick={onClose}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium"
        style={{
          textDecoration: 'none',
          color: pathname === '/flags' ? 'var(--accent)' : 'var(--text-2)',
          boxShadow: pathname === '/flags'
            ? '4px 4px 10px var(--shadow-d), -4px -4px 10px var(--shadow-l)'
            : 'none',
        }}
      >
        <span>🚩</span>
        <span>Open Flags</span>
      </Link>

      {/* Theme toggle */}
      <div className="neu-sm flex items-center justify-between px-3 py-2.5">
        <button
          className="flex items-center gap-2 text-sm"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)' }}
          onClick={toggleTheme}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        {!isAuto && (
          <button
            className="text-xs"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
            onClick={resetToAuto}
            title="Switch back to automatic"
          >Auto</button>
        )}
      </div>
    </aside>
  )
}
