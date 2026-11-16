'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, EmptyState } from '@zagoorr/ui'
import { formatDate } from '../../lib/format'

export type UserRow = {
  id: string
  name: string
  email: string
  role: string
  team: string | null
  agencyId: string | null
  agencyName: string | null
  createdAt: string
}

const ROLES = ['PLATFORM_ADMIN', 'ADMIN', 'TEAM', 'CLIENT']

function roleTone(role: string): 'brand' | 'success' | 'neutral' {
  if (role === 'PLATFORM_ADMIN') return 'brand'
  if (role === 'ADMIN') return 'success'
  return 'neutral'
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

export default function UserManager({
  users,
  agencies,
}: {
  users: UserRow[]
  agencies: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [agencyId, setAgencyId] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const platformStaff = users.filter((u) => u.role === 'PLATFORM_ADMIN')
  const tenantUsers = users.filter((u) => u.role !== 'PLATFORM_ADMIN')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      await callApi('/api/users', 'POST', {
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        agencyId: agencyId || null,
      })
      setMessage('User created.')
      setName('')
      setEmail('')
      setPassword('')
      setRole('ADMIN')
      setAgencyId('')
      setShowCreate(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the user.')
    } finally {
      setBusy(false)
    }
  }

  async function changeRole(id: string, newRole: string) {
    setError(null)
    try {
      await callApi('/api/users', 'PATCH', { id, role: newRole })
      setMessage('Role updated.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the role.')
    }
  }

  function renderTable(rows: UserRow[], title: string, emptyBody: string) {
    return (
      <div className="section">
        <h2>
          {title} ({rows.length})
        </h2>
        <Card style={{ padding: 8 }}>
          {rows.length === 0 ? (
            <EmptyState title={`No ${title.toLowerCase()} yet`} body={emptyBody} />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Agency</th>
                    <th>Role</th>
                    <th>Team</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.name}</strong>
                        <div className="muted small">{u.email}</div>
                      </td>
                      <td>{u.agencyName ?? (u.role === 'PLATFORM_ADMIN' ? 'Platform' : '—')}</td>
                      <td>
                        <select
                          aria-label={`Role for ${u.name}`}
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          style={{
                            minHeight: 36,
                            padding: '6px 10px',
                            border: '1px solid #e6eaf0',
                            borderRadius: 10,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            background: '#fff',
                          }}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>{' '}
                        <Badge tone={roleTone(u.role)}>{u.role}</Badge>
                      </td>
                      <td>{u.team ?? '—'}</td>
                      <td>{formatDate(u.createdAt)}</td>
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

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p className="muted">
            Platform staff (PLATFORM_ADMIN, no agency) and tenant teams. Change a role inline — it applies
            immediately.
          </p>
        </div>
        <Button onClick={() => setShowCreate((v) => !v)}>{showCreate ? 'Close form' : 'New user'}</Button>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {showCreate ? (
        <Card style={{ marginBottom: 20 }}>
          <h2>New user</h2>
          <p className="muted small">
            Leave the agency blank for platform staff. PLATFORM_ADMIN users can sign in at admin.zagoorr.com;
            ADMIN / TEAM users belong to an agency.
          </p>
          <form onSubmit={submit}>
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="field">
                <span>Email</span>
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="field">
                <span>Password (min 8 characters)</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Agency (blank = platform staff)</span>
                <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)}>
                  <option value="">— Platform —</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={busy}>
                {busy ? 'Creating…' : 'Create user'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {renderTable(platformStaff, 'Platform staff', 'No platform staff yet. Create the first PLATFORM_ADMIN above.')}
      {renderTable(tenantUsers, 'Tenant teams', 'No agency users yet. They appear once agencies add their teams.')}
    </div>
  )
}
