'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Logo } from '@zagoorr/ui'

/** Platform-admin login. Posts to /api/auth/login; only PLATFORM_ADMIN users can sign in here. */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'Sign-in failed.')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Could not reach the server. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card style={{ width: '100%', maxWidth: 420 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Logo size={48} withWordmark />
      </div>
      <h1 style={{ textAlign: 'center', fontSize: 22 }}>Platform Admin</h1>
      <p className="muted" style={{ textAlign: 'center' }}>
        Zagoorr staff only. Agency staff use app.zagoorr.com.
      </p>
      <form onSubmit={onSubmit}>
        <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@zagoorr.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>
        {error ? <p className="error" style={{ marginTop: 12 }}>{error}</p> : null}
        <div className="form-actions">
          <Button type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
