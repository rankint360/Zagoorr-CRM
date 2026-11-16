'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card } from '@zagoorr/ui'

export type ProviderRow = {
  provider: string
  name: string
  description: string
  connected: boolean
}

/** Backend integrations, platform-wide. Toggling connects/disconnects the provider for the platform. */
export default function IntegrationManager({ providers }: { providers: ProviderRow[] }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(provider: string, name: string, connected: boolean) {
    setError(null)
    setMessage(null)
    setBusy(provider)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, connected: !connected }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
      setMessage(`${name} ${!connected ? 'connected' : 'disconnected'}.`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the integration.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Integrations</h1>
          <p className="muted">
            Backend integrations available across the platform. Per-agency connections are managed in the agency
            app; this page controls the platform-wide availability.
          </p>
        </div>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <Card>
        {providers.map((p) => (
          <div className="toggle-row" key={p.provider}>
            <div>
              <strong>{p.name}</strong>{' '}
              <Badge tone={p.connected ? 'success' : 'neutral'}>
                {p.connected ? 'Connected' : 'Disconnected'}
              </Badge>
              <div className="muted small">{p.description}</div>
            </div>
            <Button variant="secondary" disabled={busy === p.provider} onClick={() => toggle(p.provider, p.name, p.connected)}>
              {busy === p.provider ? 'Saving…' : p.connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        ))}
      </Card>
      <p className="muted small" style={{ marginTop: 12 }}>
        Connect/disconnect here records the platform state only. Real OAuth credentials and per-provider setup are a
        follow-up — no provider secrets are stored in v1.
      </p>
    </div>
  )
}
