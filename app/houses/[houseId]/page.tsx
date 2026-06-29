'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import dynamic from 'next/dynamic'
import { Modal } from '@/components/Modal'

const RichEditor = dynamic(
  () => import('@/components/RichEditor').then(m => m.RichEditor),
  { ssr: false, loading: () => <div className="neu-inset-sm" style={{ minHeight: '8rem', borderRadius: '10px' }} /> }
)

type Tab = 'briefs' | 'flags' | 'moms' | 'kb'

interface House   { id: string; name: string; description: string | null }
interface Brief   { id: string; name: string; description: string | null; createdAt: string; _count: { logs: number } }
interface HouseFlag {
  id: string; title: string; postedAt: string; deadline: string | null
  completed: boolean; description: string | null
  brief: { id: string; name: string }
}
interface HouseMOM {
  id: string; title: string; date: string; stakeholders: string; notes: string; decisions: string
  log: { id: string; title: string; postedAt: string; brief: { id: string; name: string } }
}
interface KBEntry { id: string; title: string; body: string; createdAt: string; updatedAt: string }

export default function HousePage() {
  const { houseId } = useParams<{ houseId: string }>()

  const [house,   setHouse]   = useState<House | null>(null)
  const [briefs,  setBriefs]  = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<Tab>('briefs')

  // Lazy-loaded tab data
  const [flags,       setFlags]       = useState<HouseFlag[]>([])
  const [moms,        setMoms]        = useState<HouseMOM[]>([])
  const [kbEntries,   setKbEntries]   = useState<KBEntry[]>([])
  const [flagsLoaded, setFlagsLoaded] = useState(false)
  const [momsLoaded,  setMomsLoaded]  = useState(false)
  const [kbLoaded,    setKbLoaded]    = useState(false)
  const [flagsLoading, setFlagsLoading] = useState(false)
  const [momsLoading,  setMomsLoading]  = useState(false)
  const [kbLoading,    setKbLoading]    = useState(false)

  // Brief modal
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [briefForm,      setBriefForm]      = useState({ name: '', description: '' })
  const [briefSaving,    setBriefSaving]    = useState(false)

  // KB modal (create + edit)
  const [kbModal,  setKbModal]  = useState<{ mode: 'create' | 'edit'; entry?: KBEntry } | null>(null)
  const [kbForm,   setKbForm]   = useState({ title: '', body: '' })
  const [kbSaving, setKbSaving] = useState(false)

  /* ── Loaders ── */

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
    setFlagsLoading(false); setFlagsLoaded(true)
  }, [houseId])

  const loadMoms = useCallback(async () => {
    setMomsLoading(true)
    const res = await fetch(`/api/houses/${houseId}/moms`)
    if (res.ok) setMoms(await res.json())
    setMomsLoading(false); setMomsLoaded(true)
  }, [houseId])

  const loadKB = useCallback(async () => {
    setKbLoading(true)
    const res = await fetch(`/api/kb?houseId=${houseId}`)
    if (res.ok) setKbEntries(await res.json())
    setKbLoading(false); setKbLoaded(true)
  }, [houseId])

  useEffect(() => { loadBriefs() }, [loadBriefs])
  useEffect(() => {
    if (tab === 'flags' && !flagsLoaded) loadFlags()
    if (tab === 'moms'  && !momsLoaded)  loadMoms()
    if (tab === 'kb'    && !kbLoaded)    loadKB()
  }, [tab, flagsLoaded, momsLoaded, kbLoaded, loadFlags, loadMoms, loadKB])

  /* ── Brief CRUD ── */

  const createBrief = async () => {
    if (!briefForm.name.trim()) return
    setBriefSaving(true)
    const res = await fetch('/api/briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...briefForm, houseId }),
    })
    if (res.ok) { setBriefForm({ name: '', description: '' }); setShowBriefModal(false); await loadBriefs() }
    setBriefSaving(false)
  }

  const deleteBrief = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this brief and all its logs?')) return
    await fetch(`/api/briefs/${id}`, { method: 'DELETE' })
    loadBriefs()
  }

  /* ── Flag complete toggle ── */

  const toggleFlagComplete = async (flag: HouseFlag) => {
    await fetch(`/api/logs/${flag.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !flag.completed }),
    })
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, completed: !f.completed } : f))
  }

  /* ── KB CRUD ── */

  const openKBCreate = () => {
    setKbForm({ title: '', body: '' })
    setKbModal({ mode: 'create' })
  }

  const openKBEdit = (entry: KBEntry) => {
    setKbForm({ title: entry.title, body: entry.body })
    setKbModal({ mode: 'edit', entry })
  }

  const saveKBEntry = async () => {
    if (!kbForm.title.trim()) return
    setKbSaving(true)
    if (kbModal?.mode === 'edit' && kbModal.entry) {
      const res = await fetch(`/api/kb/${kbModal.entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: kbForm.title, body: kbForm.body }),
      })
      if (res.ok) {
        const updated = await res.json()
        setKbEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
        setKbModal(null)
      }
    } else {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ houseId, title: kbForm.title, body: kbForm.body }),
      })
      if (res.ok) {
        const created = await res.json()
        setKbEntries(prev => [created, ...prev])
        setKbModal(null)
      }
    }
    setKbSaving(false)
  }

  const deleteKBEntry = async (id: string) => {
    if (!confirm('Delete this KB entry?')) return
    await fetch(`/api/kb/${id}`, { method: 'DELETE' })
    setKbEntries(prev => prev.filter(e => e.id !== id))
  }

  /* ── Render ── */

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

  const tabs = [
    { key: 'briefs' as Tab, icon: '📋', label: 'Briefs', count: briefs.length },
    { key: 'flags'  as Tab, icon: '🚩', label: 'Flags',  count: flagsLoaded ? flags.length : null },
    { key: 'moms'   as Tab, icon: '📝', label: 'MOMs',   count: momsLoaded  ? moms.length  : null },
    { key: 'kb'     as Tab, icon: '📚', label: 'KB',     count: kbLoaded    ? kbEntries.length : null },
  ]

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/houses" className="text-sm" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Houses</Link>
        <span style={{ color: 'var(--text-3)' }}>›</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{house.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="page-title">{house.name}</h1>
          {house.description && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{house.description}</p>}
        </div>
        {tab === 'briefs' && (
          <button className="neu-btn shrink-0" style={{ color: 'var(--accent)' }} onClick={() => setShowBriefModal(true)}>
            + New Brief
          </button>
        )}
        {tab === 'kb' && (
          <button className="neu-btn shrink-0" style={{ color: 'var(--accent)' }} onClick={openKBCreate}>
            + KB Entry
          </button>
        )}
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t.key}
            className="neu-btn neu-btn-sm flex items-center gap-1.5 shrink-0"
            style={{
              color: tab === t.key ? 'var(--accent)' : 'var(--text-3)',
              boxShadow: tab === t.key
                ? 'inset 3px 3px 7px var(--shadow-d), inset -3px -3px 7px var(--shadow-l)'
                : '3px 3px 7px var(--shadow-d), -3px -3px 7px var(--shadow-l)',
              fontWeight: tab === t.key ? 600 : 450,
            }}
            onClick={() => setTab(t.key)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
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
              >{t.count}</span>
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
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Create a brief to start logging work.</p>
            <button className="neu-btn" style={{ color: 'var(--accent)' }} onClick={() => setShowBriefModal(true)}>+ New Brief</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {briefs.map(b => (
              <Link key={b.id} href={`/houses/${houseId}/${b.id}`} style={{ textDecoration: 'none' }}>
                <div className="neu p-5 card-hover flex flex-col gap-3 group relative">
                  <button
                    className="neu-btn neu-btn-sm absolute top-3 right-3 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--danger)', fontSize: '0.9rem' }}
                    onClick={e => deleteBrief(b.id, e)}
                  >×</button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span>📋</span>
                      <h2 className="section-title truncate pr-6">{b.name}</h2>
                    </div>
                    {b.description && <p className="text-sm line-clamp-2" style={{ color: 'var(--text-2)' }}>{b.description}</p>}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
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
        flagsLoading ? <Loader text="Loading flags…" /> :
        flags.length === 0 ? (
          <Empty icon="🚩" title="No flags yet" sub="Raise a flag from any log inside a brief." />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
              {flags.filter(f => !f.completed).length} open · {flags.filter(f => f.completed).length} done
            </p>
            {flags.map(flag => (
              <HouseFlagItem key={flag.id} flag={flag} houseId={houseId} onToggle={() => toggleFlagComplete(flag)} />
            ))}
          </div>
        )
      )}

      {/* ── MOMs tab ── */}
      {tab === 'moms' && (
        momsLoading ? <Loader text="Loading MOMs…" /> :
        moms.length === 0 ? (
          <Empty icon="📝" title="No MOMs yet" sub="Create a MOM from any log inside a brief." />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs mb-1" style={{ color: 'var(--text-3)' }}>
              {moms.length} meeting{moms.length !== 1 ? 's' : ''} across {briefs.length} brief{briefs.length !== 1 ? 's' : ''}
            </p>
            {moms.map(mom => <HouseMOMItem key={mom.id} mom={mom} houseId={houseId} />)}
          </div>
        )
      )}

      {/* ── KB tab ── */}
      {tab === 'kb' && (
        kbLoading ? <Loader text="Loading knowledge base…" /> :
        kbEntries.length === 0 ? (
          <div className="neu p-14 text-center">
            <div className="text-5xl mb-4">📚</div>
            <p className="section-title mb-1">Knowledge base is empty</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
              Document what the team should always know — goals, brand rules, key contacts.
            </p>
            <button className="neu-btn" style={{ color: 'var(--accent)' }} onClick={openKBCreate}>+ New KB Entry</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {kbEntries.map(entry => (
              <KBEntryCard
                key={entry.id}
                entry={entry}
                onEdit={() => openKBEdit(entry)}
                onDelete={() => deleteKBEntry(entry.id)}
              />
            ))}
          </div>
        )
      )}

      {/* ── Brief modal ── */}
      {showBriefModal && (
        <Modal title="New Brief" onClose={() => { setShowBriefModal(false); setBriefForm({ name: '', description: '' }) }}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Brief Name *</label>
              <input className="neu-input" placeholder="e.g. Brand Refresh…" value={briefForm.name} autoFocus
                onChange={e => setBriefForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createBrief() }} />
            </div>
            <div>
              <label className="label block mb-1.5">Description</label>
              <textarea className="neu-input" rows={3} placeholder="Scope, goals…" value={briefForm.description}
                onChange={e => setBriefForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button className="neu-btn flex-1" style={{ color: 'var(--accent)' }} onClick={createBrief} disabled={briefSaving || !briefForm.name.trim()}>
                {briefSaving ? 'Creating…' : 'Create Brief'}
              </button>
              <button className="neu-btn" style={{ color: 'var(--text-2)' }} onClick={() => { setShowBriefModal(false); setBriefForm({ name: '', description: '' }) }}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── KB modal ── */}
      {kbModal && (
        <Modal
          title={kbModal.mode === 'edit' ? 'Edit KB Entry' : 'New KB Entry 📚'}
          onClose={() => setKbModal(null)}
          width="max-w-2xl"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Title *</label>
              <input className="neu-input" placeholder="e.g. Brand Voice, Stakeholders, Q3 Goals…"
                value={kbForm.title} autoFocus
                onChange={e => setKbForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Content</label>
              <RichEditor
                value={kbForm.body}
                onChange={v => setKbForm(f => ({ ...f, body: v }))}
                placeholder="Document what the team needs to know…"
                minHeight="12rem"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button className="neu-btn flex-1" style={{ color: 'var(--accent)' }} onClick={saveKBEntry} disabled={kbSaving || !kbForm.title.trim()}>
                {kbSaving ? 'Saving…' : kbModal.mode === 'edit' ? 'Update Entry' : 'Save to KB'}
              </button>
              <button className="neu-btn" style={{ color: 'var(--text-3)' }} onClick={() => setKbModal(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ── Shared helpers ── */

function Loader({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>{text}</div>
    </div>
  )
}

function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="neu p-14 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="section-title mb-1">{title}</p>
      <p className="text-sm" style={{ color: 'var(--text-2)' }}>{sub}</p>
    </div>
  )
}

/* ── House Flag item ── */

function HouseFlagItem({ flag, houseId, onToggle }: { flag: HouseFlag; houseId: string; onToggle: () => void }) {
  const overdue = !flag.completed && flag.deadline && isPast(new Date(flag.deadline))
  return (
    <div className="neu-md p-4 flex items-start gap-3" style={{ opacity: flag.completed ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <input type="checkbox" className="neu-check mt-0.5 shrink-0" checked={flag.completed} onChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium" style={{ color: 'var(--text-1)', textDecoration: flag.completed ? 'line-through' : 'none' }}>
            {flag.title}
          </span>
          {flag.completed && <span className="badge badge-done">✓ Done</span>}
        </div>
        {flag.description && <p className="text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>{flag.description}</p>}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/houses/${houseId}/${flag.brief.id}`} className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
            {flag.brief.name}
          </Link>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>{format(new Date(flag.postedAt), 'MMM d, yyyy')}</span>
          {flag.deadline && (
            <span className="text-xs font-medium" style={{ color: overdue ? 'var(--danger)' : 'var(--text-3)' }}>
              {overdue ? '⚠ ' : ''}Due {format(new Date(flag.deadline), 'MMM d, yyyy')}
              {!overdue && !flag.completed && (
                <span className="ml-1 opacity-70">({formatDistanceToNow(new Date(flag.deadline), { addSuffix: true })})</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── House MOM item ── */

function HouseMOMItem({ mom, houseId }: { mom: HouseMOM; houseId: string }) {
  const [expanded, setExpanded] = useState(false)
  const stakeholders = mom.stakeholders.split(',').map(s => s.trim()).filter(Boolean)
  return (
    <div className="neu-md p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{mom.title}</span>
            <span className="badge badge-flag">📝 MOM</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href={`/houses/${houseId}/${mom.log.brief.id}`} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
              {mom.log.brief.name}
            </Link>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{format(new Date(mom.date), 'MMM d, yyyy')}</span>
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>from: {mom.log.title}</span>
          </div>
        </div>
        <button className="neu-btn neu-btn-sm shrink-0" style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}
          onClick={() => setExpanded(v => !v)}>
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>
      {stakeholders.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stakeholders.map((s, i) => (
            <span key={i} className="text-xs px-2.5 py-0.5 rounded-full"
              style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 500 }}>{s}</span>
          ))}
        </div>
      )}
      {expanded && (
        <div className="neu-inset-sm p-4 flex flex-col gap-4" style={{ borderRadius: '10px' }}>
          {mom.notes    && <div><p className="label mb-1.5">Meeting Notes</p><div className="rich-content" dangerouslySetInnerHTML={{ __html: mom.notes }} /></div>}
          {mom.decisions && <div><p className="label mb-1.5">Decisions & Outcomes</p><div className="rich-content" dangerouslySetInnerHTML={{ __html: mom.decisions }} /></div>}
        </div>
      )}
    </div>
  )
}

/* ── KB Entry card ── */

function KBEntryCard({ entry, onEdit, onDelete }: { entry: KBEntry; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const preview = entry.body.replace(/<[^>]*>/g, '').slice(0, 150)
  const hasMore  = entry.body.replace(/<[^>]*>/g, '').length > 150

  return (
    <div className="neu-md p-4 group flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{entry.title}</span>
            <span className="badge" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>📚 KB</span>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {format(new Date(entry.createdAt), 'MMM d, yyyy')}
            {entry.updatedAt !== entry.createdAt && (
              <span className="ml-2 opacity-70">· edited {format(new Date(entry.updatedAt), 'MMM d')}</span>
            )}
          </span>
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button className="neu-btn neu-btn-sm" style={{ color: 'var(--accent)', fontSize: '0.75rem' }} onClick={onEdit}>Edit</button>
          <button className="neu-btn neu-btn-sm w-7 h-7 p-0 flex items-center justify-center"
            style={{ color: 'var(--danger)', fontSize: '0.9rem' }} onClick={onDelete}>×</button>
        </div>
      </div>

      {!expanded && preview && (
        <p className="text-sm cursor-pointer" style={{ color: 'var(--text-2)' }}
          onClick={() => hasMore && setExpanded(true)}>
          {preview}{hasMore ? '…' : ''}
          {hasMore && <span className="ml-1 text-xs" style={{ color: 'var(--accent)' }}>Read more</span>}
        </p>
      )}

      {expanded && (
        <div>
          <div className="rich-content" dangerouslySetInnerHTML={{ __html: entry.body }} />
          <button onClick={() => setExpanded(false)} className="text-xs mt-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
            ▲ Collapse
          </button>
        </div>
      )}
    </div>
  )
}
