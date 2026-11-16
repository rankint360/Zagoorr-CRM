'use client'

import { useState, type FormEvent } from 'react'
import { Button } from '@zagoorr/ui'

/**
 * Intake form for one of the client's own orders. Answers and file
 * references are plain text fields in v1 (no file upload yet) and are
 * saved to order.intakeData as a JSON object.
 */
export default function IntakeForm({ orders }: { orders: { id: string; label: string }[] }) {
  const [orderId, setOrderId] = useState(orders[0]?.id ?? '')
  const [goals, setGoals] = useState('')
  const [audience, setAudience] = useState('')
  const [links, setLinks] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)
    setBusy(true)
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orderId,
          intakeData: {
            goals: goals.trim(),
            audience: audience.trim(),
            links: links.trim(),
            notes: notes.trim(),
            submittedAt: new Date().toISOString(),
          },
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'Could not save your intake. Please try again.')
        return
      }
      setOk(true)
    } catch {
      setError('Could not reach the portal. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (orders.length === 0) return null

  return (
    <form onSubmit={onSubmit} className="form">
      <label>
        Order
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        What are your goals for this service?
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)} />
      </label>
      <label>
        Who is your target audience?
        <textarea value={audience} onChange={(e) => setAudience(e.target.value)} />
      </label>
      <label>
        Links to share (website, brand assets, files — one per line)
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="https://example.com"
        />
      </label>
      <label>
        Anything else we should know?
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="form-ok" role="status">
          Intake saved — your agency can now start delivery.
        </p>
      ) : null}
      <Button type="submit" disabled={busy || !orderId}>
        {busy ? 'Saving…' : 'Save intake'}
      </Button>
    </form>
  )
}
