'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, EmptyState } from '@zagoorr/ui'
import { domainStatusTone } from '../../lib/format'

export type PortalRow = {
  id: string
  name: string
  slug: string
  portalDomain: string | null
  portalDomainStatus: string
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

/**
 * Portals & domains. Every agency gets <slug>.portal.zagoorr.com by default
 * and may add a custom CNAME domain, which starts PENDING. "Mark verified"
 * records a manual check — real automated DNS verification is a follow-up.
 */
export default function PortalManager({ agencies }: { agencies: PortalRow[] }) {
  const router = useRouter()
  const [domains, setDomains] = useState<Record<string, string>>(() =>
    Object.fromEntries(agencies.map((a): [string, string] => [a.id, a.portalDomain ?? ''])),
  )
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function saveDomain(e: FormEvent, agencyId: string) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusyId(agencyId)
    try {
      await callApi('/api/portals', 'PATCH', {
        agencyId,
        portalDomain: domains[agencyId]?.trim() || null,
      })
      setMessage('Custom domain saved — status is PENDING until verified.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the domain.')
    } finally {
      setBusyId(null)
    }
  }

  async function verify(agencyId: string, action: 'verify' | 'fail') {
    setError(null)
    setMessage(null)
    setBusyId(agencyId)
    try {
      await callApi('/api/portals', 'POST', { agencyId, action })
      setMessage(action === 'verify' ? 'Domain marked VERIFIED.' : 'Domain marked FAILED.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the domain status.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Portals &amp; domains</h1>
          <p className="muted">
            Client portals live at <strong>&lt;agency&gt;.portal.zagoorr.com</strong> by default. Agencies can point
            a custom domain at the portal with a CNAME.
          </p>
        </div>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <Card style={{ padding: 8 }}>
        {agencies.length === 0 ? (
          <EmptyState title="No agencies yet" body="Portals appear here once the first agency is created." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Default portal</th>
                  <th>Custom domain</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.name}</strong>
                    </td>
                    <td>{a.slug}.portal.zagoorr.com</td>
                    <td>
                      <form onSubmit={(e) => saveDomain(e, a.id)} style={{ display: 'flex', gap: 8 }}>
                        <input
                          aria-label={`Custom domain for ${a.name}`}
                          value={domains[a.id] ?? ''}
                          onChange={(e) => setDomains((d) => ({ ...d, [a.id]: e.target.value }))}
                          placeholder="portal.acmeagency.com"
                          style={{
                            minHeight: 40,
                            padding: '8px 12px',
                            border: '1px solid #e6eaf0',
                            borderRadius: 10,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            minWidth: 200,
                          }}
                        />
                        <Button type="submit" variant="secondary" disabled={busyId === a.id}>
                          Save
                        </Button>
                      </form>
                    </td>
                    <td>
                      <Badge tone={domainStatusTone(a.portalDomainStatus)}>{a.portalDomainStatus}</Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button
                          variant="secondary"
                          disabled={!a.portalDomain || busyId === a.id}
                          onClick={() => verify(a.id, 'verify')}
                        >
                          Mark verified
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={!a.portalDomain || busyId === a.id}
                          onClick={() => verify(a.id, 'fail')}
                        >
                          Mark failed
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="muted small" style={{ marginTop: 12 }}>
        Verification here is a manual record. Automated DNS/CNAME checking is a follow-up before custom domains are
        offered to agencies.
      </p>
    </div>
  )
}
