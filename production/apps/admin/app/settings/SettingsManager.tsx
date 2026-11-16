'use client'

import { useState, type FormEvent } from 'react'
import { Button, Card } from '@zagoorr/ui'

/**
 * Platform settings: domains, public signups, maintenance mode.
 * Maintenance mode shows a banner in this admin and is the flag the agency
 * app / portals read to show their own maintenance notice.
 */
export default function SettingsManager({ initial }: { initial: Record<string, string | boolean> }) {
  const [landing, setLanding] = useState(String(initial.landing_domain ?? 'zagoorr.com'))
  const [appDomain, setAppDomain] = useState(String(initial.app_domain ?? 'app.zagoorr.com'))
  const [adminDomain, setAdminDomain] = useState(String(initial.admin_domain ?? 'admin.zagoorr.com'))
  const [portalDomain, setPortalDomain] = useState(String(initial.portal_domain ?? 'portal.zagoorr.com'))
  const [publicSignups, setPublicSignups] = useState(initial.public_signups === true)
  const [maintenance, setMaintenance] = useState(initial.maintenance_mode === true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            landing_domain: landing.trim(),
            app_domain: appDomain.trim(),
            admin_domain: adminDomain.trim(),
            portal_domain: portalDomain.trim(),
            public_signups: publicSignups,
            maintenance_mode: maintenance,
          },
        }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
      setMessage('Platform settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Platform settings</h1>
          <p className="muted">Domains, public signups, and maintenance mode for the whole platform.</p>
        </div>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <Card>
        <form onSubmit={submit}>
          <h2>Domains</h2>
          <div className="form-grid">
            <label className="field">
              <span>Landing page domain</span>
              <input value={landing} onChange={(e) => setLanding(e.target.value)} />
            </label>
            <label className="field">
              <span>Agency app domain</span>
              <input value={appDomain} onChange={(e) => setAppDomain(e.target.value)} />
            </label>
            <label className="field">
              <span>Admin domain</span>
              <input value={adminDomain} onChange={(e) => setAdminDomain(e.target.value)} />
            </label>
            <label className="field">
              <span>Portal base domain</span>
              <input value={portalDomain} onChange={(e) => setPortalDomain(e.target.value)} />
            </label>
          </div>

          <div className="section">
            <h2>Access</h2>
            <label className="check-row">
              <input type="checkbox" checked={publicSignups} onChange={(e) => setPublicSignups(e.target.checked)} />
              Public signups enabled (agencies can self-register)
            </label>
            <p className="muted small" style={{ marginTop: 6 }}>
              Off means agencies are created by platform staff only.
            </p>
          </div>

          <div className="section">
            <h2>Maintenance mode</h2>
            <label className="check-row">
              <input type="checkbox" checked={maintenance} onChange={(e) => setMaintenance(e.target.checked)} />
              Maintenance mode ON
            </label>
            <p className="muted small" style={{ marginTop: 6 }}>
              Shows a banner in this admin. The agency app and client portals read the same flag to show their
              maintenance notice.
            </p>
          </div>

          <div className="form-actions">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
