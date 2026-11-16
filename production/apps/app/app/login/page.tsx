'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Logo } from '@zagoorr/ui'

/** Agency staff sign-in. Posts to /api/auth/login, which sets the session cookie. */
export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Sign-in failed')
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Logo size={40} withWordmark />
        </div>
        <h1>Sign in to your agency</h1>
        <p className="muted">Agency staff only. Clients use the client portal instead.</p>
        <form className="form" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <div className="notice error" role="alert">{error}</div> : null}
          <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </Card>
    </div>
  )
}
