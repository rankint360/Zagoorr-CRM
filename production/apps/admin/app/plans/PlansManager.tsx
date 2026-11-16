'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, EmptyState } from '@zagoorr/ui'
import { formatDate, formatMoney, invoiceStatusTone } from '../../lib/format'

export type PlanRow = {
  id: string
  name: string
  tier: string
  priceMonthly: number
  currency: string
  seats: number
  features: unknown[]
}

export type InvoiceRow = {
  id: string
  number: string
  agencyName: string
  contactName: string
  amount: number
  currency: string
  taxRate: number
  status: string
  dueDate: string | null
  createdAt: string
}

export type AgencyContacts = {
  id: string
  name: string
  contacts: { id: string; name: string; email: string }[]
}

const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID']

async function callApi(path: string, method: string, body: unknown) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { error?: string } | null
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`)
}

/** Plans & billing. Billing is tracking only — no Stripe, no payment keys. */
export default function PlansManager({
  plans,
  invoices,
  agencies,
}: {
  plans: PlanRow[]
  invoices: InvoiceRow[]
  agencies: AgencyContacts[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [agencyId, setAgencyId] = useState(agencies[0]?.id ?? '')
  const [contactId, setContactId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState('0')
  const [status, setStatus] = useState('DRAFT')
  const [dueDate, setDueDate] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const selectedAgency = agencies.find((a) => a.id === agencyId) ?? null
  const contacts = selectedAgency?.contacts ?? []

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      await callApi('/api/invoices', 'POST', {
        agencyId,
        contactId,
        amount: Math.round(Number(amount) * 100),
        currency: currency.trim().toUpperCase() || 'USD',
        taxRate: Number(taxRate),
        status,
        dueDate: dueDate || null,
      })
      setMessage('Invoice recorded (tracking only — no payment taken).')
      setAmount('')
      setDueDate('')
      setShowForm(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the invoice.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Plans &amp; billing</h1>
          <p className="muted">
            Subscription plans and platform invoices. Billing is tracking only — payments are on hold, no payment
            provider is wired in.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} disabled={agencies.length === 0}>
          {showForm ? 'Close form' : 'Record invoice'}
        </Button>
      </div>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="section" style={{ marginTop: 0 }}>
        <h2>Plans ({plans.length})</h2>
        <div className="stat-grid">
          {plans.length === 0 ? (
            <Card>
              <EmptyState
                title="No plans yet"
                body="Plans are seeded with the database (STARTER / GROWTH / SCALE). Add them via the database or a future plan editor."
              />
            </Card>
          ) : (
            plans.map((p) => (
              <div className="stat-card" key={p.id}>
                <div className="stat-label">{p.tier}</div>
                <div className="stat-value" style={{ fontSize: 22 }}>
                  {p.name}
                </div>
                <div className="stat-sub">
                  {formatMoney(p.priceMonthly, p.currency)} / month · {p.seats} seat{p.seats === 1 ? '' : 's'}
                </div>
                {p.features.length > 0 ? (
                  <div className="small muted" style={{ marginTop: 8 }}>
                    {p.features.map((f) => String(f)).join(' · ')}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      {showForm ? (
        <Card style={{ marginTop: 20 }}>
          <h2>Record invoice</h2>
          {contacts.length === 0 ? (
            <p className="muted">
              The selected agency has no contacts yet, and invoices are billed to a contact. Add a contact in the
              agency app first.
            </p>
          ) : (
            <form onSubmit={submit}>
              <div className="form-grid">
                <label className="field">
                  <span>Agency</span>
                  <select
                    value={agencyId}
                    onChange={(e) => {
                      setAgencyId(e.target.value)
                      setContactId('')
                    }}
                  >
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Billed contact</span>
                  <select required value={contactId} onChange={(e) => setContactId(e.target.value)}>
                    <option value="">Select a contact…</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Amount (e.g. 49.00)</span>
                  <input required type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </label>
                <label className="field">
                  <span>Currency</span>
                  <input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
                </label>
                <label className="field">
                  <span>Tax rate (%)</span>
                  <input type="number" min={0} step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {INVOICE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Due date</span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </label>
              </div>
              <div className="form-actions">
                <Button type="submit" disabled={busy || !contactId}>
                  {busy ? 'Recording…' : 'Record invoice'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      ) : null}

      <div className="section">
        <h2>Invoices ({invoices.length})</h2>
        <Card style={{ padding: 8 }}>
          {invoices.length === 0 ? (
            <EmptyState title="No invoices yet" body="Invoices recorded here are tracking only — no money moves." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Agency / Contact</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <strong>{inv.number}</strong>
                      </td>
                      <td>
                        {inv.agencyName}
                        <div className="muted small">{inv.contactName}</div>
                      </td>
                      <td>
                        {formatMoney(inv.amount, inv.currency)}
                        {inv.taxRate ? <div className="muted small">+{inv.taxRate}% tax</div> : null}
                      </td>
                      <td>
                        <Badge tone={invoiceStatusTone(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td>{formatDate(inv.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
