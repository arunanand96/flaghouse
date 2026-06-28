'use client'

import { useState, useEffect } from 'react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { Modal } from '@/components/Modal'

interface OpenFlag {
  id: string
  title: string
  description: string | null
  deadline: string | null
  completed: boolean
  priority: 'LOW' | 'MID' | 'HIGH'
  createdAt: string
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MID: 'Mid',
  HIGH: 'High',
}

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'badge-low',
  MID: 'badge-mid',
  HIGH: 'badge-high',
}

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MID: 1, LOW: 2 }

export default function FlagsPage() {
  const [flags, setFlags] = useState<OpenFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'MID' as 'LOW' | 'MID' | 'HIGH',
  })

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/open-flags')
    if (res.ok) setFlags(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createFlag = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const res = await fetch('/api/open-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        deadline: form.deadline || null,
        priority: form.priority,
      }),
    })
    if (res.ok) {
      setForm({ title: '', description: '', deadline: '', priority: 'MID' })
      setShowModal(false)
      await load()
    }
    setSaving(false)
  }

  const toggleComplete = async (flag: OpenFlag) => {
    await fetch(`/api/open-flags/${flag.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !flag.completed }),
    })
    setFlags(prev =>
      prev.map(f => f.id === flag.id ? { ...f, completed: !f.completed } : f)
    )
  }

  const deleteFlag = async (id: string) => {
    if (!confirm('Delete this flag?')) return
    await fetch(`/api/open-flags/${id}`, { method: 'DELETE' })
    setFlags(prev => prev.filter(f => f.id !== id))
  }

  const filtered = flags
    .filter(f => {
      if (filter === 'OPEN') return !f.completed
      if (filter === 'DONE') return f.completed
      return true
    })
    .sort((a, b) => {
      // Sort: incomplete first, then by priority, then by deadline
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (pd !== 0) return pd
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      if (b.deadline) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const openCount = flags.filter(f => !f.completed).length
  const doneCount = flags.filter(f => f.completed).length

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Open Flags</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Standalone tasks — not tied to any brief.
          </p>
        </div>
        <button
          className="neu-btn"
          style={{ color: 'var(--accent)' }}
          onClick={() => setShowModal(true)}
        >
          🚩 New Flag
        </button>
      </div>

      {/* Filter tabs */}
      {flags.length > 0 && (
        <div className="flex gap-2 mb-6">
          {(['ALL', 'OPEN', 'DONE'] as const).map(f => (
            <button
              key={f}
              className="neu-btn neu-btn-sm"
              style={{
                color: filter === f ? 'var(--accent)' : 'var(--text-3)',
                boxShadow:
                  filter === f
                    ? 'inset 3px 3px 7px var(--shadow-d), inset -3px -3px 7px var(--shadow-l)'
                    : '3px 3px 7px var(--shadow-d), -3px -3px 7px var(--shadow-l)',
              }}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? `All (${flags.length})` : f === 'OPEN' ? `Open (${openCount})` : `Done (${doneCount})`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>Loading…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="neu p-14 text-center">
          <div className="text-5xl mb-4">🚩</div>
          <p className="section-title mb-1">
            {filter === 'DONE' ? 'Nothing done yet' : filter === 'OPEN' ? 'All caught up!' : 'No flags yet'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            {filter === 'ALL'
              ? 'Flags here are independent of any house or brief.'
              : filter === 'OPEN'
              ? 'All your open flags are done — nice work.'
              : 'Complete a flag to see it here.'}
          </p>
          {filter === 'ALL' && (
            <button
              className="neu-btn mt-5"
              style={{ color: 'var(--accent)' }}
              onClick={() => setShowModal(true)}
            >
              🚩 New Flag
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(flag => (
            <OpenFlagItem
              key={flag.id}
              flag={flag}
              onToggleComplete={() => toggleComplete(flag)}
              onDelete={() => deleteFlag(flag.id)}
            />
          ))}
        </div>
      )}

      {/* New Flag Modal */}
      {showModal && (
        <Modal
          title="New Open Flag"
          onClose={() => {
            setShowModal(false)
            setForm({ title: '', description: '', deadline: '', priority: 'MID' })
          }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">Title *</label>
              <input
                className="neu-input"
                placeholder="What needs to be done…"
                value={form.title}
                autoFocus
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createFlag() }}
              />
            </div>
            <div>
              <label className="label block mb-1.5">Description</label>
              <textarea
                className="neu-input"
                rows={3}
                placeholder="Details, context, links…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label block mb-1.5">Deadline</label>
                <input
                  type="date"
                  className="neu-input"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                />
              </div>
              <div>
                <label className="label block mb-1.5">Priority</label>
                <div className="flex gap-1.5">
                  {(['LOW', 'MID', 'HIGH'] as const).map(p => (
                    <button
                      key={p}
                      className="neu-btn neu-btn-sm flex-1"
                      style={{
                        color:
                          p === 'LOW' ? 'var(--success)'
                          : p === 'HIGH' ? 'var(--danger)'
                          : '#c8890c',
                        boxShadow:
                          form.priority === p
                            ? 'inset 2px 2px 6px var(--shadow-d), inset -2px -2px 6px var(--shadow-l)'
                            : '3px 3px 7px var(--shadow-d), -3px -3px 7px var(--shadow-l)',
                        fontWeight: form.priority === p ? 700 : 500,
                      }}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                    >
                      {PRIORITY_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                className="neu-btn flex-1"
                style={{ color: 'var(--accent)' }}
                onClick={createFlag}
                disabled={saving || !form.title.trim()}
              >
                {saving ? 'Creating…' : 'Create Flag'}
              </button>
              <button
                className="neu-btn"
                style={{ color: 'var(--text-3)' }}
                onClick={() => {
                  setShowModal(false)
                  setForm({ title: '', description: '', deadline: '', priority: 'MID' })
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Open Flag card
───────────────────────────────────────── */

function OpenFlagItem({
  flag,
  onToggleComplete,
  onDelete,
}: {
  flag: OpenFlag
  onToggleComplete: () => void
  onDelete: () => void
}) {
  const overdue =
    !flag.completed && flag.deadline && isPast(new Date(flag.deadline))

  return (
    <div
      className="neu-md p-4 group flex items-start gap-3"
      style={{ opacity: flag.completed ? 0.6 : 1, transition: 'opacity 0.2s' }}
    >
      <input
        type="checkbox"
        className="neu-check mt-0.5"
        checked={flag.completed}
        onChange={onToggleComplete}
        title={flag.completed ? 'Mark incomplete' : 'Mark complete'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
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
              <span className={`badge ${PRIORITY_BADGE[flag.priority]}`}>
                {PRIORITY_LABELS[flag.priority]}
              </span>
              {flag.completed && (
                <span className="badge badge-done">✓ Done</span>
              )}
            </div>

            {flag.description && (
              <p className="text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>
                {flag.description}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                {format(new Date(flag.createdAt), 'MMM d, yyyy')}
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

          {/* Delete */}
          <button
            className="neu-btn neu-btn-sm w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            style={{ color: 'var(--danger)', fontSize: '0.9rem' }}
            onClick={onDelete}
            title="Delete"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
