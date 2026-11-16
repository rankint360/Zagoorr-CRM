'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@zagoorr/ui'

/** Email + access code login. Posts to /api/auth/portal-login; on success
 *  the server sets the CLIENT session cookie and we go to the dashboard. */
export default function LoginForm({ agencyName }: { agencyName: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/portal-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), accessCode: accessCode.trim() }),
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'Sign-in failed. Please try again.')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Could not reach the portal. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Sign in to {agencyName}</h2>
      <p style={{ color: '#5B6B7F', marginTop: 0 }}>
        Use the email address and access code your agency sent you.
      </p>
      <form onSubmit={onSubmit} className="form">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>
        <label>
          Access code
          <input
            type="password"
            autoComplete="one-time-code"
            required
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="6-digit code"
          />
        </label>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Card>
  )
}
