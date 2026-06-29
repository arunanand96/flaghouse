'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import dynamic from 'next/dynamic'
import { Modal } from '@/components/Modal'

const RichEditor = dynamic(
  () => import('@/components/RichEditor').then(m => m.RichEditor),
  { ssr: false, loading: () => <div className="neu-inset-sm" style={{ minHeight: '7rem', borderRadius: '10px' }} /> }
)

interface MOM { id: string; title: string; date: string; stakeholders: string; notes: string; decisions: string; createdAt: string }
interface LogEntry { id: string; title: string; postedAt: string; isFlag: boolean; description: string | null; deadline: string | null; completed: boolean; mom: MOM | null }
interface Brief { id: string; name: string; description: string | null; house: { id: string; name: string } }

type ModalMode =
  | { type: 'add-log' }
  | { type: 'add-flag' }
  | { type: 'raise-flag'; log: LogEntry }
  | { type: 'mom'; log: LogEntry }
  | { type: 'kb-from-mom'; mom: MOM }

type LogFilter = 'all' | 'logs' | 'flags' | 'moms'

export default function BriefPage() {
  const { houseId, briefId } = useParams<{ houseId: string; briefId: string }>()

  const [brief,   setBrief]   = useState<Brief | null>(null)
  const [logs,    setLogs]    = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<ModalMode | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [filter,  setFilter]  = useState<LogFilter>('all')

  const [logForm,  setLogForm]  = useState({ title: '' })
  const [flagForm, setFlagForm] = useState({ title: '', description: '', deadline: '' })
  const [momForm,  setMomForm]  = useState({ title: '', date: '', stakeholders: '', notes: '', decisions: '' })
  const [kbForm,   setKbForm]   = useState({ title: '', body: '' })

  const load = useCallback(async () => {
    const [bRes, lRes] = await Promise.all([
      fetch(`/api/briefs/${briefId}`),
      fetch(`/api/logs?briefId=${briefId}`),
    ])
    if (bRes.ok) setBrief(await bRes.json())
    if (lRes.ok) setLogs(await lRes.json())
    setLoading(false)
  }, [briefId])

  useEffect(() => { load() }, [load])

  const openModal = (m: ModalMode) => {
    if (m.type === 'raise-flag') {
      setFlagForm({ title: m.log.title, description: '', deadline: '' })
    } else if (m.type === 'mom') {
      const ex = m.log.mom
      setMomForm({
        title:        ex?.title        ?? m.log.title,
        date:         ex ? format(new Date(ex.date), 'yyyy-MM-dd') : format(new Date(m.log.postedAt), 'yyyy-MM-dd'),
        stakeholders: ex?.stakeholders ?? '',
        notes:        ex?.notes        ?? '',
        decisions:    ex?.decisions    ?? '',
      })
    } else if (m.type === 'add-flag') {
      setFlagForm({ title: '', description: '', deadline: '' })
    } else if (m.type === 'kb-from-mom') {
      const parts = [
        m.mom.notes     ? `<h3>Meeting Notes</h3>${m.mom.notes}` : '',
        m.mom.decisions ? `<h3>Decisions &amp; Outcomes</h3>${m.mom.decisions}` : '',
      ].filter(Boolean).join('')
      setKbForm({ title: m.mom.title, body: parts })
    } else {
      setLogForm({ title: '' })
    }
    setModal(m)
  }

  const closeModal = () => {
    setModal(null)
    setLogForm({ title: '' })
    setFlagForm({ title: '', description: '', deadline: '' })
    setMomForm({ title: '', date: '', stakeholders: '', notes: '', decisions: '' })
    setKbForm({ title: '', body: '' })
  }

  /* ── Submits ── */

  const submitAddLog = async () => {
    if (!logForm.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: logForm.title.trim(), briefId }),
    })
    if (res.ok) { closeModal(); await load() }
    setSaving(false)
  }

  const submitAddFlag = async () => {
    if (!flagForm.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: flagForm.title.trim(), briefId, isFlag: true, description: flagForm.description.trim() || null, deadline: flagForm.deadline || null }),
    })
    if (res.ok) { closeModal(); await load() }
    setSaving(false)
  }

  const submitRaiseFlag = async () => {
    if (modal?.type !== 'raise-flag') return
    setSaving(true)
    const res = await fetch(`/api/logs/${modal.log.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: flagForm.title.trim(), isFlag: true, description: flagForm.description.trim() || null, deadline: flagForm.deadline || null }),
    })
    if (res.ok) { closeModal(); await load() }
    setSaving(false)
  }

  const submitMOM = async () => {
    if (modal?.type !== 'mom') return
    if (!momForm.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/moms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId: modal.log.id, title: momForm.title.trim(), date: momForm.date, stakeholders: momForm.stakeholders.trim(), notes: momForm.notes, decisions: momForm.decisions }),
    })
    if (res.ok) { closeModal(); await load() }
    setSaving(false)
  }

  const submitKBFromMOM = async () => {
    if (modal?.type !== 'kb-from-mom') return
    if (!kbForm.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/kb', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ houseId, title: kbForm.title.trim(), body: kbForm.body }),
    })
    if (res.ok) { closeModal() }
    setSaving(false)
  }

  const toggleComplete = async (log: LogEntry) => {
    await fetch(`/api/logs/${log.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !log.completed }),
    })
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, completed: !l.completed } : l))
  }

  const deleteLog = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    await fetch(`/api/logs/${id}`, { method: 'DELETE' })
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const deleteMOM = async (log: LogEntry) => {
    if (!log.mom) return
    if (!confirm('Delete this MOM?')) return
    await fetch(`/api/moms/${log.mom.id}`, { method: 'DELETE' })
    setLogs(prev => prev.map(l => l.id === log.id ? { ...l, mom: null } : l))
  }

  if (loading) return <div className="flex items-center justify-center py-24"><div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>Loading…</div></div>
  if (!brief)  return <div className="neu p-10 text-center max-w-sm"><p style={{ color: 'var(--text-2)' }}>Brief not found.</p></div>

  /* ── Filter logic ── */

  const logCount  = logs.filter(l => !l.isFlag).length
  const flagCount = logs.filter(l => l.isFlag).length
  const doneCount = logs.filter(l => l.isFlag && l.completed).length
  const momCount  = logs.filter(l => !!l.mom).length
  const showFilters = logs.length > 0 && (flagCount > 0 || momCount > 0)

  const filteredLogs = logs.filter(l => {
    if (filter === 'logs')  return !l.isFlag
    if (filter === 'flags') return l.isFlag
    if (filter === 'moms')  return !!l.mom
    return true
  })

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <Link href="/houses" className="text-sm" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Houses</Link>
        <span style={{ color: 'var(--text-3)' }}>›</span>
        <Link href={`/houses/${houseId}`} className="text-sm" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{brief.house.name}</Link>
        <span style={{ color: 'var(--text-3)' }}>›</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>{brief.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="page-title">{brief.name}</h1>
          {brief.description && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{brief.description}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="neu-btn neu-btn-sm" style={{ color: 'var(--text-2)' }} onClick={() => openModal({ type: 'add-log' })}>+ Log</button>
          <button className="neu-btn neu-btn-sm" style={{ color: 'var(--accent)' }} onClick={() => openModal({ type: 'add-flag' })}>🚩 Flag</button>
        </div>
      </div>

      {/* Filter tabs */}
      {showFilters && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {([
            { key: 'all',   label: 'All',   count: logs.length },
            { key: 'logs',  label: 'Logs',  count: logCount },
            { key: 'flags', label: 'Flags', count: flagCount },
            { key: 'moms',  label: 'MOMs',  count: momCount },
          ] as { key: LogFilter; label: string; count: number }[])
            .filter(t => t.key === 'all' || t.count > 0)
            .map(t => (
              <button key={t.key}
                className="neu-btn neu-btn-sm flex items-center gap-1.5 shrink-0"
                style={{
                  color: filter === t.key ? 'var(--accent)' : 'var(--text-3)',
                  boxShadow: filter === t.key
                    ? 'inset 3px 3px 7px var(--shadow-d), inset -3px -3px 7px var(--shadow-l)'
                    : '3px 3px 7px var(--shadow-d), -3px -3px 7px var(--shadow-l)',
                  fontWeight: filter === t.key ? 600 : 450,
                }}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: filter === t.key ? 'var(--accent-bg)' : 'transparent', color: filter === t.key ? 'var(--accent)' : 'var(--text-3)', fontWeight: 600 }}>
                  {t.count}
                </span>
              </button>
            ))}
        </div>
      )}

      {/* List */}
      {logs.length === 0 ? (
        <div className="neu p-14 text-center">
          <div className="text-5xl mb-4">📝</div>
          <p className="section-title mb-1">Nothing logged yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Add a log to record activity, or raise a flag for a task.</p>
          <div className="flex gap-3 justify-center">
            <button className="neu-btn" style={{ color: 'var(--text-2)' }} onClick={() => openModal({ type: 'add-log' })}>+ Add Log</button>
            <button className="neu-btn" style={{ color: 'var(--accent)' }} onClick={() => openModal({ type: 'add-flag' })}>🚩 Add Flag</button>
          </div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="neu-md p-10 text-center">
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No {filter === 'moms' ? 'MOMs' : filter} in this brief yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredLogs.map(entry => (
            <LogItem key={entry.id} entry={entry}
              onRaiseFlag={() => openModal({ type: 'raise-flag', log: entry })}
              onCreateMOM={() => openModal({ type: 'mom', log: entry })}
              onToggleComplete={() => toggleComplete(entry)}
              onDelete={() => deleteLog(entry.id)}
              onDeleteMOM={() => deleteMOM(entry)}
              onSendToKB={entry.mom ? () => openModal({ type: 'kb-from-mom', mom: entry.mom! }) : undefined}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {logs.length > 0 && (
        <div className="flex gap-3 mt-5 text-xs flex-wrap" style={{ color: 'var(--text-3)' }}>
          <span>{logCount} log{logCount !== 1 ? 's' : ''}</span>
          <span>·</span><span>{flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
          {doneCount > 0 && <><span>·</span><span style={{ color: 'var(--success)' }}>{doneCount} done</span></>}
          {momCount > 0  && <><span>·</span><span style={{ color: 'var(--accent)' }}>{momCount} MOM{momCount !== 1 ? 's' : ''}</span></>}
        </div>
      )}

      {/* ── Modals ── */}

      {modal?.type === 'add-log' && (
        <Modal title="Add Log" onClose={closeModal}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Log Title *</label>
              <input className="neu-input" placeholder="What happened, what was shipped…" value={logForm.title} autoFocus
                onChange={e => setLogForm({ title: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') submitAddLog() }} />
            </div>
            <div className="flex gap-3">
              <button className="neu-btn flex-1" style={{ color: 'var(--text-2)' }} onClick={submitAddLog} disabled={saving || !logForm.title.trim()}>
                {saving ? 'Saving…' : 'Add Log'}
              </button>
              <button className="neu-btn" style={{ color: 'var(--text-3)' }} onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'add-flag' && (
        <Modal title="Add Brief Flag" onClose={closeModal}>
          <FlagForm form={flagForm} setForm={setFlagForm} onSubmit={submitAddFlag} onCancel={closeModal} saving={saving} submitLabel="Create Flag" />
        </Modal>
      )}

      {modal?.type === 'raise-flag' && (
        <Modal title="Raise as Flag 🚩" onClose={closeModal}>
          <p className="text-sm -mt-2 mb-2" style={{ color: 'var(--text-3)' }}>This log becomes a Brief Flag. Add details below.</p>
          <FlagForm form={flagForm} setForm={setFlagForm} onSubmit={submitRaiseFlag} onCancel={closeModal} saving={saving} submitLabel="Raise Flag" accent />
        </Modal>
      )}

      {modal?.type === 'mom' && (
        <Modal title={modal.log.mom ? 'Edit MOM 📝' : 'Create MOM 📝'} onClose={closeModal} width="max-w-2xl">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Title *</label>
                <input className="neu-input" placeholder="Meeting title…" value={momForm.title} autoFocus
                  onChange={e => setMomForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label block mb-1.5">Date</label>
                <input type="date" className="neu-input" value={momForm.date} onChange={e => setMomForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label block mb-1.5">Stakeholders</label>
              <input className="neu-input" placeholder="Alice, Bob, Carol…" value={momForm.stakeholders}
                onChange={e => setMomForm(f => ({ ...f, stakeholders: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Meeting Notes</label>
              <RichEditor value={momForm.notes} onChange={v => setMomForm(f => ({ ...f, notes: v }))} placeholder="What was discussed…" minHeight="7rem" />
            </div>
            <div>
              <label className="label block mb-1.5">Decisions & Outcomes</label>
              <RichEditor value={momForm.decisions} onChange={v => setMomForm(f => ({ ...f, decisions: v }))} placeholder="What was decided…" minHeight="7rem" />
            </div>
            <div className="flex gap-3 pt-1">
              <button className="neu-btn flex-1" style={{ color: 'var(--accent)' }} onClick={submitMOM} disabled={saving || !momForm.title.trim()}>
                {saving ? 'Saving…' : modal.log.mom ? 'Update MOM' : 'Save MOM'}
              </button>
              <button className="neu-btn" style={{ color: 'var(--text-3)' }} onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {modal?.type === 'kb-from-mom' && (
        <Modal title="Send to KB 📚" onClose={closeModal} width="max-w-2xl">
          <p className="text-sm -mt-2 mb-2" style={{ color: 'var(--text-3)' }}>
            Trim this down to the durable insight the whole team should know.
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Title *</label>
              <input className="neu-input" value={kbForm.title} autoFocus
                onChange={e => setKbForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label block mb-1.5">Content</label>
              <RichEditor value={kbForm.body} onChange={v => setKbForm(f => ({ ...f, body: v }))} placeholder="Edit to just the essential knowledge…" minHeight="10rem" />
            </div>
            <div className="flex gap-3 pt-1">
              <button className="neu-btn flex-1" style={{ color: 'var(--accent)' }} onClick={submitKBFromMOM} disabled={saving || !kbForm.title.trim()}>
                {saving ? 'Saving…' : 'Save to KB'}
              </button>
              <button className="neu-btn" style={{ color: 'var(--text-3)' }} onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ── Log / Flag card ── */

function LogItem({ entry, onRaiseFlag, onCreateMOM, onToggleComplete, onDelete, onDeleteMOM, onSendToKB }: {
  entry: LogEntry; onRaiseFlag: () => void; onCreateMOM: () => void
  onToggleComplete: () => void; onDelete: () => void; onDeleteMOM: () => void
  onSendToKB?: () => void
}) {
  const [momOpen, setMomOpen] = useState(false)
  const overdue = entry.isFlag && !entry.completed && entry.deadline && isPast(new Date(entry.deadline))

  return (
    <div className="neu-md p-4 flex flex-col gap-2.5" style={{ opacity: entry.completed ? 0.65 : 1, transition: 'opacity 0.2s' }}>
      <div className="flex items-start gap-2.5">
        {entry.isFlag && (
          <input type="checkbox" className="neu-check mt-0.5 shrink-0" checked={entry.completed} onChange={onToggleComplete} />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-medium" style={{ color: 'var(--text-1)', textDecoration: entry.completed ? 'line-through' : 'none' }}>
              {entry.title}
            </span>
            {entry.isFlag && <span className="badge badge-flag">🚩 Flag</span>}
            {entry.completed && <span className="badge badge-done">✓ Done</span>}
            {entry.mom && (
              <button onClick={() => setMomOpen(v => !v)} className="badge"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', cursor: 'pointer', border: 'none' }}>
                📝 MOM {momOpen ? '▲' : '▼'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-3)' }}>{format(new Date(entry.postedAt), 'MMM d, yyyy · h:mm a')}</span>
            {entry.deadline && (
              <span className="text-xs font-medium" style={{ color: overdue ? 'var(--danger)' : 'var(--text-3)' }}>
                {overdue ? '⚠ ' : ''}Due {format(new Date(entry.deadline), 'MMM d, yyyy')}
                {!overdue && !entry.completed && <span className="ml-1 opacity-70">({formatDistanceToNow(new Date(entry.deadline), { addSuffix: true })})</span>}
              </span>
            )}
          </div>
        </div>
        <ActionsDropdown entry={entry} onRaiseFlag={onRaiseFlag} onCreateMOM={onCreateMOM} onDelete={onDelete} />
      </div>

      {entry.isFlag && entry.description && (
        <p className="text-sm" style={{ color: 'var(--text-2)', borderLeft: '2px solid var(--accent-bg)', paddingLeft: '0.75rem', marginLeft: entry.isFlag ? '1.625rem' : '0' }}>
          {entry.description}
        </p>
      )}

      {entry.mom && momOpen && (
        <MOMPanel mom={entry.mom} onEdit={onCreateMOM} onDelete={onDeleteMOM} onSendToKB={onSendToKB} />
      )}
    </div>
  )
}

/* ── Actions dropdown ── */

function ActionsDropdown({ entry, onRaiseFlag, onCreateMOM, onDelete }: {
  entry: LogEntry; onRaiseFlag: () => void; onCreateMOM: () => void; onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className="relative shrink-0">
      <button className="neu-btn neu-btn-sm w-7 h-7 p-0" style={{ color: 'var(--text-3)', letterSpacing: '0.05em' }}
        onClick={() => setOpen(v => !v)}>···</button>
      {open && (
        <div className="neu-md absolute right-0 top-full mt-1.5 z-30 py-1.5 flex flex-col" style={{ minWidth: '10rem' }}>
          {!entry.isFlag && <DropItem icon="🚩" label="Raise as Flag" onClick={() => { setOpen(false); onRaiseFlag() }} />}
          <DropItem icon="📝" label={entry.mom ? 'Edit MOM' : 'Create MOM'} onClick={() => { setOpen(false); onCreateMOM() }} />
          <div className="neu-divider mx-3 my-1" />
          <DropItem icon="×" label="Delete" onClick={() => { setOpen(false); onDelete() }} danger />
        </div>
      )}
    </div>
  )
}

function DropItem({ icon, label, onClick, danger = false }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-left w-full"
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: danger ? 'var(--danger)' : 'var(--text-2)', fontWeight: 450 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = danger ? 'var(--danger)' : 'var(--text-1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = danger ? 'var(--danger)' : 'var(--text-2)' }}>
      <span style={{ width: '1rem', textAlign: 'center' }}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

/* ── MOM panel ── */

function MOMPanel({ mom, onEdit, onDelete, onSendToKB }: { mom: MOM; onEdit: () => void; onDelete: () => void; onSendToKB?: () => void }) {
  const stakeholders = mom.stakeholders.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="neu-inset-sm mt-1 p-4 flex flex-col gap-4" style={{ borderRadius: '10px' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{mom.title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{format(new Date(mom.date), 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {onSendToKB && (
            <button className="neu-btn neu-btn-sm" style={{ color: 'var(--accent)', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
              onClick={onSendToKB} title="Send to House KB">
              → KB
            </button>
          )}
          <button className="neu-btn neu-btn-sm" style={{ color: 'var(--accent)', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }} onClick={onEdit}>Edit</button>
          <button className="neu-btn neu-btn-sm w-6 h-6 p-0 flex items-center justify-center" style={{ color: 'var(--danger)', fontSize: '0.85rem' }} onClick={onDelete}>×</button>
        </div>
      </div>

      {stakeholders.length > 0 && (
        <div>
          <p className="label mb-1.5">Stakeholders</p>
          <div className="flex flex-wrap gap-1.5">
            {stakeholders.map((s, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 500 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {mom.notes    && <div><p className="label mb-1.5">Meeting Notes</p><div className="rich-content" dangerouslySetInnerHTML={{ __html: mom.notes }} /></div>}
      {mom.decisions && <div><p className="label mb-1.5">Decisions & Outcomes</p><div className="rich-content" dangerouslySetInnerHTML={{ __html: mom.decisions }} /></div>}
    </div>
  )
}

/* ── Flag form ── */

function FlagForm({ form, setForm, onSubmit, onCancel, saving, submitLabel, accent = false }: {
  form: { title: string; description: string; deadline: string }
  setForm: React.Dispatch<React.SetStateAction<{ title: string; description: string; deadline: string }>>
  onSubmit: () => void; onCancel: () => void; saving: boolean; submitLabel: string; accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="label block mb-1.5">Title *</label>
        <input className="neu-input" placeholder="What needs to be done…" value={form.title} autoFocus
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      </div>
      <div>
        <label className="label block mb-1.5">Description</label>
        <textarea className="neu-input" rows={3} placeholder="Context, links, criteria…" value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label className="label block mb-1.5">Deadline</label>
        <input type="date" className="neu-input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-1">
        <button className="neu-btn flex-1" style={{ color: accent ? 'var(--accent)' : 'var(--text-2)' }} onClick={onSubmit} disabled={saving || !form.title.trim()}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className="neu-btn" style={{ color: 'var(--text-3)' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
