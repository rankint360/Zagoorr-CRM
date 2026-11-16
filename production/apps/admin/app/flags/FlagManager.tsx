'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, EmptyState } from '@zagoorr/ui'
import { formatDate } from '../../lib/format'

export type FlagRow = {
  id: string
  key: string
  name: string
  enabled: boolean
  description: string | null
  createdAt: string
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

export default function FlagManager({ flags }: { flags: FlagRow[] }) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      await callApi('/api/flags', 'POST', {
        key: key.trim().toLowerCase(),
        name: name.trim(),
        description: description.trim() || null,
        enabled: false,
      })
      setMessage('Feature flag created (off by default).')
      setKey('')
      setName('')
      setDescription('')
      setShowCreate(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the flag.')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(flag: FlagRow) {
    setError(null)
    setBusyId(flag.id)
    try {
      await callApi('/api/flags', 'PATCH', { id: flag.id, enabled: !flag.enabled })
      setMessage(`Flag "${flag.key}" ${!flag.enabled ? 'enabled' : 'disabled'}.`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not toggle the flag.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Feature flags</h1>
          <p className="muted">Platform-wide feature flags. Toggle a flag to roll a feature out (or back) for everyone.</p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}>{showCreate ? 'Close form' : 'New flag'}</Button>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {showCreate ? (
        <Card style={{ marginBottom: 20 }}>
          <h2>New feature flag</h2>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label className="field">
                <span>Key (lowercase, underscores)</span>
                <input
                  required
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="new_portal_theme"
                  pattern="[a-z0-9_]+"
                  title="Lowercase letters, numbers and underscores only"
                />
              </label>
              <label className="field">
                <span>Name</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="New portal theme" />
              </label>
              <label className="field">
                <span>Description</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create flag'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card>
        {flags.length === 0 ? (
          <EmptyState title="No feature flags yet" body="Create the first flag above to gate a rollout." />
        ) : (
          flags.map((f) => (
            <div className="toggle-row" key={f.id}>
              <div>
                <strong>{f.name}</strong> <span className="muted small">{f.key}</span>{' '}
                <Badge tone={f.enabled ? 'success' : 'neutral'}>{f.enabled ? 'Enabled' : 'Disabled'}</Badge>
                {f.description ? <div className="muted small">{f.description}</div> : null}
                <div className="muted small">Created {formatDate(f.createdAt)}</div>
              </div>
              <Button variant="secondary" disabled={busyId === f.id} onClick={() => toggle(f)}>
                {busyId === f.id ? 'Saving…' : f.enabled ? 'Disable' : 'Enable'}
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}
