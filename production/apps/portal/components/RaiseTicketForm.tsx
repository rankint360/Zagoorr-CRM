'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@zagoorr/ui'

/** Raise a support ticket for one of the client's own orders. */
export default function RaiseTicketForm({ orders }: { orders: { id: string; label: string }[] }) {
  const router = useRouter()
  const [orderId, setOrderId] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(false)
    setBusy(true)
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          orderId: orderId || undefined,
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'Could not raise the ticket. Please try again.')
        return
      }
      setOk(true)
      setSubject('')
      setBody('')
      setOrderId('')
      router.refresh()
    } catch {
      setError('Could not reach the portal. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label>
        Related order (optional)
        <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
          <option value="">General question</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Subject
        <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label>
        What do you need help with?
        <textarea required value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p className="form-ok" role="status">
          Ticket raised — your agency will get back to you.
        </p>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? 'Raising…' : 'Raise ticket'}
      </Button>
    </form>
  )
}
