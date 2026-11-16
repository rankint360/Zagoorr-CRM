'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, TwoTapConfirm } from '@zagoorr/ui'

async function patchJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Request failed')
  }
}

async function postJson(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'Request failed')
  }
}

/** Mark a deal Won or Lost. Winning a deal creates its order + project. */
export function DealStageButtons({ dealId, stage }: { dealId: string; stage: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function setStage(next: 'WON' | 'LOST') {
    setBusy(true)
    setError(null)
    try {
      await patchJson('/api/deals', { id: dealId, stage: next })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  if (stage === 'WON' || stage === 'LOST') return null

  return (
    <span style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
      <Button variant="secondary" disabled={busy} onClick={() => void setStage('WON')}>
        Mark won
      </Button>
      <Button variant="ghost" disabled={busy} onClick={() => void setStage('LOST')}>
        Mark lost
      </Button>
      {error ? <span style={{ color: '#DC2626', fontSize: 13 }}>{error}</span> : null}
    </span>
  )
}

/** Cancel an order (in-page two-tap confirm — never browser confirm()). */
export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <TwoTapConfirm
        label="Cancel order"
        confirmLabel="Yes, cancel"
        onConfirm={() => {
          void patchJson('/api/orders', { id: orderId, status: 'CANCELLED' })
            .then(() => router.refresh())
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Request failed'))
        }}
      />
      {error ? <span style={{ color: '#DC2626', fontSize: 13 }}>{error}</span> : null}
    </span>
  )
}

/** Change a ticket's status. */
export function TicketStatusSelect({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [value, setValue] = useState(status)

  return (
    <select
      aria-label="Ticket status"
      value={value}
      disabled={busy}
      onChange={(e) => {
        const next = e.target.value
        setValue(next)
        setBusy(true)
        void patchJson('/api/tickets', { id: ticketId, status: next })
          .then(() => router.refresh())
          .catch(() => setValue(status))
          .finally(() => setBusy(false))
      }}
    >
      <option value="OPEN">Open</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="WAITING_CLIENT">Waiting on client</option>
      <option value="RESOLVED">Resolved</option>
      <option value="CLOSED">Closed</option>
    </select>
  )
}

/** Toggle a task between done and to-do. */
export function TaskToggle({ taskId, done }: { taskId: string; done: boolean }) {
  const router = useRouter()
  const [checked, setChecked] = useState(done)
  const [busy, setBusy] = useState(false)

  return (
    <input
      type="checkbox"
      aria-label="Mark task done"
      checked={checked}
      disabled={busy}
      style={{ width: 20, height: 20, minHeight: 20, accentColor: '#FF6B4A' }}
      onChange={(e) => {
        const next = e.target.checked
        setChecked(next)
        setBusy(true)
        void patchJson(`/api/tasks/${taskId}`, { status: next ? 'DONE' : 'TODO' })
          .then(() => router.refresh())
          .catch(() => setChecked(!next))
          .finally(() => setBusy(false))
      }}
    />
  )
}

/** Revoke an API key (in-page two-tap confirm — never browser confirm()). */
export function RevokeApiKeyButton({ keyId }: { keyId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <TwoTapConfirm
        label="Revoke"
        confirmLabel="Yes, revoke"
        onConfirm={() => {
          void fetch(`/api/api-keys?id=${encodeURIComponent(keyId)}`, { method: 'DELETE' })
            .then((res) => {
              if (!res.ok) throw new Error('Revoke failed')
              router.refresh()
            })
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Request failed'))
        }}
      />
      {error ? <span style={{ color: '#DC2626', fontSize: 13 }}>{error}</span> : null}
    </span>
  )
}

/** Connect / disconnect an integration provider. */
export function IntegrationToggle({ provider, connected }: { provider: string; connected: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <Button
        variant={connected ? 'secondary' : 'primary'}
        disabled={busy}
        onClick={() => {
          setBusy(true)
          setError(null)
          void postJson('/api/integrations', { provider, connected: !connected })
            .then(() => router.refresh())
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Request failed'))
            .finally(() => setBusy(false))
        }}
      >
        {connected ? 'Disconnect' : 'Connect'}
      </Button>
      {error ? <span style={{ color: '#DC2626', fontSize: 13 }}>{error}</span> : null}
    </span>
  )
}
