'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { Modal } from '@/components/Modal'

type Tab = 'briefs' | 'flags' | 'moms'

interface House {
  id: string
  name: string
  description: string | null
}

interface Brief {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: { logs: number }
}

interface HouseFlag {
  id: string
  title: string
  postedAt: string
  deadline: string | null
  completed: boolean
  description: string | null
  brief: { id: string; name: string }
}

interface HouseMOM {
  id: string
  title: string
  date: string
  stakeholders: string
  notes: string
  decisions: string
  log: {
    id: string
    title: string
    postedAt: string
    brief: { id: string; name: string }
  }
}

export default function HousePage() {
  const { houseId } = useParams<{ houseId: string }>()

  const [house, setHouse] = useState<House | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('briefs')

  const [flags, setFlags] = useState<HouseFlag[]>([])
  const [moms, setMoms] = useState<HouseMOM[]>([])
  const [flagsLoading, setFlagsLoading] = useState(false)
  const [momsLoading, setMomsLoading] = useState(false)
  const [flagsLoaded, setFlagsLoaded] = useState(false)
  const [momsLoaded, setMomsLoaded] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const loadBriefs = useCallback(async () => {
    setLoading(true)
    const [hRes, bRes] = await Promise.all([
      fetch(`/api/houses/${houseId}`),
      fetch(`/api/briefs?houseId=${houseId}`),
    ])
    if (hRes.ok) setHouse(await hRes.json())
    if (bRes.ok) setBriefs(await bRes.json())
    setLoading(false)
  }, [houseId])

  const loadFlags = useCallback(async () => {
    setFlagsLoading(true)
    const res = await fetch(`/api/houses/${houseId}/flags`)
    if (res.ok) setFlags(await res.json())
    setFlagsLoading(false)
    setFlagsLoaded(true)
  }, [houseId])

  const loadMoms = useCallback(async () => {
    setMomsLoading(true)
    const res = await fetch(`/api/houses/${houseId}/moms`)
    if (res.ok) setMoms(await res.json())
    setMomsLoading(false)
    setMomsLoaded(true)
  }, [houseId])

  useEffect(() => { loadBriefs() }, [loadBriefs])

  useEffect(() => {
    if (tab === 'flags' && !flagsLoaded) loadFlags()
    if (tab === 'moms' && !momsLoaded) loadMoms()
  }, [tab, flagsLoaded, momsLoaded, loadFlags, loadMoms])

  const createBrief = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, houseId }),
    })
    if (res.ok) {
      setForm({ name: '', description: '' })
      setShowModal(false)
      await loadBriefs()
    }
    setSaving(false)
  }

  const deleteBrief = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this brief and all its logs?')) return
    await fetch(`/api/briefs/${id}`, { method: 'DELETE' })
    loadBriefs()
  }

  const toggleFlagComplete = async (flag: HouseFlag) => {
    await fetch(`/api/logs/${flag.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !flag.completed }),
    })
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, completed: !f.completed } : f))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>Loading…</div>
      </div>
    )
  }

  if (!house) {
    return (
      <div className="neu p-10 text-center max-w-sm">
        <p style={{ color: 'var(--text-2)' }}>House not found.</p>
        <Link href="/houses" className="text-sm mt-3 block" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back</Link>
      </div>
    )
  }

  const openFlagCount = flags.filter(f => !f.completed).length

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/houses" className="text-sm" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Houses</Link>
        <span style={{ color: 'var(--text-3)' }}>›</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{house.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="page-title">{house.name}</h1>
          {house.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{house.description}</p>
          )}
        </div>
        {tab === 'briefs' && (
          <button className="neu-btn" style={{ color: 'var(--accent)' }} onClick={() => setShowModal(true)}>
            + New Brief
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-7">
        {([ 
          { key: 'briefs', label: `Briefs`, count: briefs.length },
          { key: 'flags',  label: 'Flags',  count: flagsLoaded ? flags.length : null },
          { key: 'moms',   label: 'MOMs',   count: momsLoaded ? moms.length : null },
        ] as { key: Tab; label: string; count: number | null }[]).map(t => (
          <button
            key={t.key}
            className="neu-btn neu-btn-sm flex items-center gap-1.5"
            style={{
              color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
              boxShadow: tab === t.key
                ? 'inset 3px 3px 7px var(--shadow-d), inset -3px -3px 7px var(--shadow-l)'
                : '3px 3px 7px var(--shadow-d), -3px -3px 7px var(--shadow-l)',
              fontWeight: tab === t.key ? 600 : 450,
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {t.count !== null && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === t.key ? 'var(--accent-bg)' : 'transparent',
                  color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
                  fontWeight: 600,
                  minWidth: '1.25rem',
                  textAlign: 'center',
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Briefs tab ── */}
      {tab === 'briefs' && (
        briefs.length === 0 ? (
          <div className="neu p-14 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="section-title mb-1">No briefs yet</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>Create a brief to start logging work.</p>
            <button className="neu-btn mt-5" style={{ color: 'var(--accent)' }} onClick={() => setShowModal(true)}>
              + New Brief
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {briefs.map(b => (
              <Link key={b.id} href={`/houses/${houseId}/${b.id}`} style={{ textDecoration: 'none' }}>
                <div className="neu p-6 card-hover flex flex-col gap-3 group relative">
                  <button
                    className="neu-btn neu-btn-sm absolute top-3 right-3 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--danger)', fontSize: '0.9rem' }}
                    onClick={e => deleteBrief(b.id, e)}
                  >×</button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📋</span>
                      <h2 className="section-title truncate pr-6">{b.name}</h2>
                    </div>
                    {b.description && (
                      <p className="text-sm line-clamp-2 mt-1" style={{ color: 'var(--text-2)' }}>{b.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="badge badge-flag">{b._count.logs} {b._count.logs === 1 ? 'entry' : 'entries'}</span>
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>{format(new Date(b.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* ── Flags tab ── */}
      {tab === 'flags' && (
        flagsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>Loading flags…</div>
          </div>
        ) : flags.length === 0 ? (
          <div className="neu p-14 text-center">
            <div className="text-5xl mb-4">🚩</div>
            <p className="section-title mb-1">No flags yet</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Raise a flag from any log inside a brief.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {openFlagCount > 0 && (
              <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
                {openFlagCount} open · {flags.filter(f => f.completed).length} done
              </p>
            )}
            {flags.map(flag => (
              <HouseFlagItem
                key={flag.id}
                flag={flag}
                houseId={houseId}
                onToggle={() => toggleFlagComplete(flag)}
              />
            ))}
          </div>
        )
      )}

      {/* ── MOMs tab ── */}
      {tab === 'moms' && (
        momsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>Loading MOMs…</div>
          </div>
        ) : moms.length === 0 ? (
          <div className="neu p-14 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="section-title mb-1">No MOMs yet</p>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Create a MOM from any log inside a brief.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
              {moms.length} meeting{moms.length !== 1 ? 's' : ''} across {briefs.length} brief{briefs.length !== 1 ? 's' : ''}
            </p>
            {moms.map(mom => (
              <HouseMOMItem key={mom.id} mom={mom} houseId={houseId} />
            ))}
          </div>
        )
      )}

      {/* New Brief Modal */}
      {showModal && (
        <Modal title="New Brief" onClose={() => { setShowModal(false); setForm({ name: '', description: '' }) }}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Brief Name *</label>
              <input
                className="neu-input"
                placeholder="e.g. Brand Refresh, Q3 Campaign…"
                value={form.name}
                autoFocus
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createBrief() }}
              />
            </div>
            <div>
              <label className="label block mb-1.5">Description</label>
              <textarea
                className="neu-input"
                rows={3}
                placeholder="Scope, goals, context…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button className="neu-btn flex-1" style={{ color: 'var(--accent)' }} onClick={createBrief} disabled={saving || !form.name.trim()}>
                {saving ? 'Creating…' : 'Create Brief'}
              </button>
              <button className="neu-btn" style={{ color: 'var(--text-2)' }} onClick={() => { setShowModal(false); setForm({ name: '', description: '' }) }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   House-level Flag item
───────────────────────────────────────────── */

function HouseFlagItem({
  flag,
  houseId,
  onToggle,
}: {
  flag: HouseFlag
  houseId: string
  onToggle: () => void
}) {
  const overdue = !flag.completed && flag.deadline && isPast(new Date(flag.deadline))

  return (
    <div
      className="neu-md p-4 flex items-start gap-3"
      style={{ opacity: flag.completed ? 0.6 : 1, transition: 'opacity 0.2s' }}
    >
      <input
        type="checkbox"
        className="neu-check mt-0.5 shrink-0"
        checked={flag.completed}
        onChange={onToggle}
        title={flag.completed ? 'Mark incomplete' : 'Mark complete'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className="text-sm font-medium"
            style={{
              color: 'var(--text-1)',
              textDecoration: flag.completed ? 'line-through' : 'none',
            }}
          >
            {flag.title}
          </span>
          {flag.completed && <span className="badge badge-done">✓ Done</span>}
        </div>

        {flag.description && (
          <p className="text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>{flag.description}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {/* Brief context pill */}
          <Link
            href={`/houses/${houseId}/${flag.brief.id}`}
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--accent-bg)',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            {flag.brief.name}
          </Link>

          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {format(new Date(flag.postedAt), 'MMM d, yyyy')}
          </span>

          {flag.deadline && (
            <span
              className="text-xs font-medium"
              style={{ color: overdue ? 'var(--danger)' : 'var(--text-3)' }}
            >
              {overdue ? '⚠ ' : ''}Due {format(new Date(flag.deadline), 'MMM d, yyyy')}
              {!overdue && !flag.completed && (
                <span className="ml-1 opacity-70">
                  ({formatDistanceToNow(new Date(flag.deadline), { addSuffix: true })})
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   House-level MOM item
───────────────────────────────────────────── */

function HouseMOMItem({ mom, houseId }: { mom: HouseMOM; houseId: string }) {
  const [expanded, setExpanded] = useState(false)

  const stakeholders = mom.stakeholders
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  return (
    <div className="neu-md p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>
              {mom.title}
            </span>
            <span className="badge badge-flag">📋 MOM</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Brief context pill */}
            <Link
              href={`/houses/${houseId}/${mom.log.brief.id}`}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--accent-bg)',
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {mom.log.brief.name}
            </Link>

            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              {format(new Date(mom.date), 'MMM d, yyyy')}
            </span>

            <span className="text-xs" style={{ color: 'var(--text-3)' }}>
              from: {mom.log.title}
            </span>
          </div>
        </div>

        <button
          className="neu-btn neu-btn-sm shrink-0"
          style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {/* Stakeholders always visible */}
      {stakeholders.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stakeholders.map((s, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 500 }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="neu-inset-sm p-4 flex flex-col gap-4" style={{ borderRadius: '10px' }}>
          {mom.notes && (
            <div>
              <p className="label mb-1.5">Meeting Notes</p>
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: mom.notes }} />
            </div>
          )}
          {mom.decisions && (
            <div>
              <p className="label mb-1.5">Decisions & Outcomes</p>
              <div className="rich-content" dangerouslySetInnerHTML={{ __html: mom.decisions }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
