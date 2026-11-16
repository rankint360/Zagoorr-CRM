'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, EmptyState, TwoTapConfirm } from '@zagoorr/ui'
import { agencyStatusTone, formatDate } from '../../lib/format'

export type AgencyRow = {
  id: string
  name: string
  slug: string
  website: string | null
  email: string
  status: string
  planId: string | null
  planName: string | null
  seats: number
  brandColor: string
  currency: string
  taxRate: number
  portalDomain: string | null
  portalDomainStatus: string
  userCount: number
  createdAt: string
}

export type PlanRow = {
  id: string
  name: string
  tier: string
  priceMonthly: number
  currency: string
  seats: number
}

const STATUSES = ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']

type FormState = {
  name: string
  slug: string
  email: string
  website: string
  planId: string
  seats: string
  brandColor: string
  currency: string
  taxRate: string
  status: string
}

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  email: '',
  website: '',
  planId: '',
  seats: '1',
  brandColor: '#FF6B4A',
  currency: 'USD',
  taxRate: '0',
  status: 'TRIAL',
}

function toForm(a: AgencyRow): FormState {
  return {
    name: a.name,
    slug: a.slug,
    email: a.email,
    website: a.website ?? '',
    planId: a.planId ?? '',
    seats: String(a.seats),
    brandColor: a.brandColor,
    currency: a.currency,
    taxRate: String(a.taxRate),
    status: a.status,
  }
}

async function callApi(path: string, method: string, body: unknown) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
}

export default function AgencyManager({ agencies, plans }: { agencies: AgencyRow[]; plans: PlanRow[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        email: form.email.trim(),
        website: form.website.trim() || null,
        planId: form.planId || null,
        seats: Number(form.seats),
        brandColor: form.brandColor,
        currency: form.currency.trim().toUpperCase() || 'USD',
        taxRate: Number(form.taxRate),
        status: form.status,
      }
      if (editingId) {
        await callApi('/api/agencies', 'PATCH', { id: editingId, ...payload })
        setMessage('Agency updated.')
      } else {
        await callApi('/api/agencies', 'POST', payload)
        setMessage('Agency created.')
      }
      setShowCreate(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the agency.')
    } finally {
      setBusy(false)
    }
  }

  async function setStatus(id: string, status: string) {
    setError(null)
    try {
      await callApi('/api/agencies', 'PATCH', { id, status })
      setMessage(`Agency ${status.toLowerCase()}.`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change status.')
    }
  }

  async function remove(id: string) {
    setError(null)
    try {
      await callApi('/api/agencies', 'DELETE', { id })
      setMessage('Agency deleted.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the agency.')
    }
  }

  const editing = editingId ? agencies.find((a) => a.id === editingId) ?? null : null
  const formOpen = showCreate || editing !== null

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Agencies</h1>
          <p className="muted">
            Tenants on the platform. {agencies.length} agency{agencies.length === 1 ? '' : 'ies'} · production starts
            empty.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setForm(EMPTY_FORM)
            setShowCreate((v) => !v)
          }}
        >
          {showCreate ? 'Close form' : 'New agency'}
        </Button>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {formOpen ? (
        <Card style={{ marginBottom: 20 }}>
          <h2>{editing ? `Edit ${editing.name}` : 'New agency'}</h2>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label className="field">
                <span>Agency name</span>
                <input required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Agency" />
              </label>
              <label className="field">
                <span>Slug (portal subdomain)</span>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="acme"
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers and hyphens only"
                />
              </label>
              <label className="field">
                <span>Billing email</span>
                <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </label>
              <label className="field">
                <span>Website</span>
                <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
              </label>
              <label className="field">
                <span>Plan</span>
                <select value={form.planId} onChange={(e) => set('planId', e.target.value)}>
                  <option value="">No plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.tier})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Seats</span>
                <input required type="number" min={1} value={form.seats} onChange={(e) => set('seats', e.target.value)} />
              </label>
              <label className="field">
                <span>Brand colour</span>
                <input type="color" value={form.brandColor} onChange={(e) => set('brandColor', e.target.value)} />
              </label>
              <label className="field">
                <span>Currency</span>
                <input value={form.currency} onChange={(e) => set('currency', e.target.value)} placeholder="USD" />
              </label>
              <label className="field">
                <span>Tax rate (%)</span>
                <input type="number" min={0} step="0.1" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} />
              </label>
              <label className="field">
                <span>Status</span>
                <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Create agency'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreate(false)
                  setEditingId(null)
                  setForm(EMPTY_FORM)
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card style={{ padding: 8 }}>
        {agencies.length === 0 ? (
          <EmptyState
            title="No agencies yet"
            body="Create the first agency above. Each agency gets a portal at <slug>.portal.zagoorr.com."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Plan</th>
                  <th>Seats / Users</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.name}</strong>
                      <div className="muted small">
                        {a.slug}.portal.zagoorr.com · {a.email}
                      </div>
                      <div className="small">
                        <span className="dot" style={{ background: a.brandColor }} />
                        {a.brandColor}
                        {a.portalDomain ? ` · ${a.portalDomain} (${a.portalDomainStatus})` : ''}
                      </div>
                    </td>
                    <td>{a.planName ?? '—'}</td>
                    <td>
                      {a.seats} / {a.userCount}
                    </td>
                    <td>
                      <Badge tone={agencyStatusTone(a.status)}>{a.status}</Badge>
                    </td>
                    <td>{formatDate(a.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setShowCreate(false)
                            setEditingId(a.id)
                            setForm(toForm(a))
                          }}
                        >
                          Edit
                        </Button>
                        {a.status !== 'ACTIVE' ? (
                          <Button variant="secondary" onClick={() => setStatus(a.id, 'ACTIVE')}>
                            Activate
                          </Button>
                        ) : null}
                        {a.status !== 'SUSPENDED' ? (
                          <Button variant="secondary" onClick={() => setStatus(a.id, 'SUSPENDED')}>
                            Suspend
                          </Button>
                        ) : null}
                        {a.status !== 'CANCELLED' ? (
                          <Button variant="secondary" onClick={() => setStatus(a.id, 'CANCELLED')}>
                            Cancel
                          </Button>
                        ) : null}
                        <TwoTapConfirm label="Delete" confirmLabel="Delete agency" onConfirm={() => remove(a.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
