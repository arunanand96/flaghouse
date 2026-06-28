'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Modal } from '@/components/Modal'

interface House {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: { briefs: number }
}

export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/houses')
    if (res.ok) setHouses(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createHouse = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/houses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: '', description: '' })
      setShowModal(false)
      await load()
    }
    setSaving(false)
  }

  const deleteHouse = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this house and all its briefs?')) return
    await fetch(`/api/houses/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Houses</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Your client roster. Each house holds briefs.
          </p>
        </div>
        <button
          className="neu-btn"
          style={{ color: 'var(--accent)' }}
          onClick={() => setShowModal(true)}
        >
          + New House
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="neu-md px-8 py-4" style={{ color: 'var(--text-3)' }}>
            Loading houses…
          </div>
        </div>
      ) : houses.length === 0 ? (
        <div className="neu p-14 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <p className="section-title mb-1">No houses yet</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Add your first house to start tracking client work.
          </p>
          <button
            className="neu-btn mt-5"
            style={{ color: 'var(--accent)' }}
            onClick={() => setShowModal(true)}
          >
            + New House
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {houses.map(h => (
            <Link
              key={h.id}
              href={`/houses/${h.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="neu p-6 card-hover flex flex-col gap-3 group relative">
                {/* Delete */}
                <button
                  className="neu-btn neu-btn-sm absolute top-3 right-3 w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--danger)', fontSize: '0.9rem' }}
                  onClick={e => deleteHouse(h.id, e)}
                  title="Delete house"
                >
                  ×
                </button>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🏠</span>
                    <h2 className="section-title truncate pr-6">{h.name}</h2>
                  </div>
                  {h.description && (
                    <p
                      className="text-sm line-clamp-2 mt-1"
                      style={{ color: 'var(--text-2)' }}
                    >
                      {h.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2">
                  <span
                    className="badge badge-flag"
                    style={{ background: 'var(--accent-bg)' }}
                  >
                    {h._count.briefs} {h._count.briefs === 1 ? 'brief' : 'briefs'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                    {format(new Date(h.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New House Modal */}
      {showModal && (
        <Modal title="New House" onClose={() => { setShowModal(false); setForm({ name: '', description: '' }) }}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label block mb-1.5">House Name *</label>
              <input
                className="neu-input"
                placeholder="e.g. Acme Corp, Nike, Studio Ghibli…"
                value={form.name}
                autoFocus
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createHouse() }}
              />
            </div>
            <div>
              <label className="label block mb-1.5">Description</label>
              <textarea
                className="neu-input"
                rows={3}
                placeholder="Quick note about this client…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                className="neu-btn flex-1"
                style={{ color: 'var(--accent)' }}
                onClick={createHouse}
                disabled={saving || !form.name.trim()}
              >
                {saving ? 'Creating…' : 'Create House'}
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
