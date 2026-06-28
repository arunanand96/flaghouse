'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Modal } from '@/components/Modal'

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

export default function HousePage() {
  const { houseId } = useParams<{ houseId: string }>()

  const [house, setHouse] = useState<House | null>(null)
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [hRes, bRes] = await Promise.all([
      fetch(`/api/houses/${houseId}`),
      fetch(`/api/briefs?houseId=${houseId}`),
    ])
    if (hRes.ok) setHouse(await hRes.json())
    if (bRes.ok) setBriefs(await bRes.json())
    setLoading(false)
  }, [houseId])

  useEffect(() => { load() }, [load])

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
      await load()
    }
    setSaving(false)
  }

  const deleteBrief = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this brief and all its logs?')) return
    await fetch(`/api/briefs/${id}`, { method: 'DELETE' })
    load()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>
          Loading…
        </div>
      </div>
    )
  }

  if (!house) {
    return (
      <div className="neu p-10 text-center max-w-sm">
        <p style={{ color: 'var(--text-2)' }}>House not found.</p>
        <Link href="/houses" className="text-sm mt-3 block" style={{ color: 'var(--accent)' }}>
          ← Back to Houses
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/houses"
          className="text-sm"
          style={{ color: 'var(--accent)', textDecoration: 'none' }}
        >
          Houses
        </Link>
        <span style={{ color: 'var(--text-3)' }}>›</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
          {house.name}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">{house.name}</h1>
          {house.description && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
              {house.description}
            </p>
          )}
        </div>
        <button
          className="neu-btn"
          style={{ color: 'var(--accent)' }}
          onClick={() => setShowModal(true)}
        >
          + New Brief
        </button>
      </div>

      {/* Briefs */}
      {briefs.length === 0 ? (
        <div className="neu p-14 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="section-title mb-1">No briefs yet</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Create a brief to start logging work for {house.name}.
          </p>
          <button
            className="neu-btn mt-5"
            style={{ color: 'var(--accent)' }}
            onClick={() => setShowModal(true)}
          >
            + New Brief
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {briefs.map(b => (
            <Link
              key={b.id}
              href={`/houses/${houseId}/${b.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="neu p-6 card-hover flex flex-col gap-3 group relative">
                {/* Delete */}
                <button
                  className="neu-btn neu-btn-sm absolute top-3 right-3 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--danger)', fontSize: '0.9rem' }}
                  onClick={e => deleteBrief(b.id, e)}
                  title="Delete brief"
                >
                  ×
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">📋</span>
                    <h2 className="section-title truncate pr-6">{b.name}</h2>
                  </div>
                  {b.description && (
                    <p
                      className="text-sm line-clamp-2 mt-1"
                      style={{ color: 'var(--text-2)' }}
                    >
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="badge badge-flag">
                    {b._count.logs} {b._count.logs === 1 ? 'entry' : 'entries'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {format(new Date(b.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Brief Modal */}
      {showModal && (
        <Modal
          title="New Brief"
          onClose={() => { setShowModal(false); setForm({ name: '', description: '' }) }}
        >
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
              <button
                className="neu-btn flex-1"
                style={{ color: 'var(--accent)' }}
                onClick={createBrief}
                disabled={saving || !form.name.trim()}
              >
                {saving ? 'Creating…' : 'Create Brief'}
              </button>
              <button
                className="neu-btn"
                style={{ color: 'var(--text-2)' }}
                onClick={() => { setShowModal(false); setForm({ name: '', description: '' }) }}
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
