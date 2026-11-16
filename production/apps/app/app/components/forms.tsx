'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@zagoorr/ui'

export type Option = { id: string; label: string }

async function postJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Request failed')
  return data
}

async function patchJson(url: string, body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Request failed')
  return data
}

function useSubmit() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: FormEvent, run: () => Promise<Record<string, unknown> | void>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const data = await run()
      if (data && typeof data.message === 'string') setNotice(data.message)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, notice, setNotice, submit }
}

function FormStatus({ error, notice }: { error: string | null; notice: string | null }) {
  return (
    <>
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      {notice ? <div className="notice ok" role="status">{notice}</div> : null}
    </>
  )
}

/** Create a contact. */
export function CreateContactForm() {
  const { busy, error, notice, submit } = useSubmit()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/contacts', { firstName, lastName, email, phone })
          setFirstName('')
          setLastName('')
          setEmail('')
          setPhone('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="contact-first">First name</label>
          <input id="contact-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="contact-last">Last name</label>
          <input id="contact-last" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="contact-email">Email</label>
          <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="contact-phone">Phone</label>
          <input id="contact-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add contact'}</Button></div>
    </form>
  )
}

/** Add an activity note to a contact's timeline. */
export function AddActivityForm({ contactId }: { contactId: string }) {
  const { busy, error, notice, submit } = useSubmit()
  const [type, setType] = useState('note')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/activities', { contactId, type, title, body })
          setTitle('')
          setBody('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="activity-type">Type</label>
          <select id="activity-type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="activity-title">Title</label>
          <input id="activity-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
      </div>
      <div className="field">
        <label htmlFor="activity-body">Details</label>
        <textarea id="activity-body" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add to timeline'}</Button></div>
    </form>
  )
}

/** Create a deal. */
export function CreateDealForm({ contacts, services }: { contacts: Option[]; services: Option[] }) {
  const { busy, error, notice, submit } = useSubmit()
  const [title, setTitle] = useState('')
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '')
  const [serviceId, setServiceId] = useState('')
  const [value, setValue] = useState('')
  const [currency, setCurrency] = useState('USD')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/deals', { title, contactId, serviceId: serviceId || undefined, value, currency })
          setTitle('')
          setValue('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="deal-title">Deal title</label>
          <input id="deal-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="deal-contact">Contact</label>
          <select id="deal-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="deal-service">Service</label>
          <select id="deal-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">— None —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="deal-value">Value</label>
          <input id="deal-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" required />
        </div>
        <div className="field">
          <label htmlFor="deal-currency">Currency</label>
          <select id="deal-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy || contacts.length === 0}>{busy ? 'Adding…' : 'Add deal'}</Button></div>
    </form>
  )
}

/** Create an order directly (normally created automatically when a deal is won). */
export function CreateOrderForm({ contacts, services }: { contacts: Option[]; services: Option[] }) {
  const { busy, error, notice, submit } = useSubmit()
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '')
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/orders', { contactId, serviceId, amount, currency })
          setAmount('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="order-contact">Contact</label>
          <select id="order-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="order-service">Service</label>
          <select id="order-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="order-amount">Amount</label>
          <input id="order-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        </div>
        <div className="field">
          <label htmlFor="order-currency">Currency</label>
          <select id="order-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy || contacts.length === 0 || services.length === 0}>{busy ? 'Adding…' : 'Create order'}</Button></div>
    </form>
  )
}

/** Create a project (optionally linked to an order). */
export function CreateProjectForm({ orders }: { orders: Option[] }) {
  const { busy, error, notice, submit } = useSubmit()
  const [name, setName] = useState('')
  const [orderId, setOrderId] = useState('')
  const [dueDate, setDueDate] = useState('')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/projects', { name, orderId: orderId || undefined, dueDate: dueDate || undefined })
          setName('')
          setDueDate('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="project-name">Project name</label>
          <input id="project-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="project-order">Linked order</label>
          <select id="project-order" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">— None —</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="project-due">Due date</label>
          <input id="project-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Create project'}</Button></div>
    </form>
  )
}

/** Add a task to a project. */
export function AddTaskForm({ projectId }: { projectId: string }) {
  const { busy, error, notice, submit } = useSubmit()
  const [title, setTitle] = useState('')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/tasks', { projectId, title })
          setTitle('')
        })
      }
    >
      <div className="row">
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor={`task-title-${projectId}`}>New task</label>
          <input id={`task-title-${projectId}`} value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div style={{ paddingTop: 24 }}><Button type="submit" disabled={busy}>Add task</Button></div>
      </div>
      <FormStatus error={error} notice={notice} />
    </form>
  )
}

/** Create a support ticket. */
export function CreateTicketForm({ contacts }: { contacts: Option[] }) {
  const { busy, error, notice, submit } = useSubmit()
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('NORMAL')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/tickets', { contactId, subject, body, priority })
          setSubject('')
          setBody('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="ticket-contact">Contact</label>
          <select id="ticket-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ticket-priority">Priority</label>
          <select id="ticket-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="ticket-subject">Subject</label>
        <input id="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="ticket-body">Details</label>
        <textarea id="ticket-body" value={body} onChange={(e) => setBody(e.target.value)} />
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy || contacts.length === 0}>{busy ? 'Creating…' : 'Create ticket'}</Button></div>
    </form>
  )
}

/** Create an invoice (tracking only — no payment is processed). */
export function CreateInvoiceForm({ contacts }: { contacts: Option[] }) {
  const { busy, error, notice, submit } = useSubmit()
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState('0')
  const [dueDate, setDueDate] = useState('')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/invoices', { contactId, amount, currency, taxRate, dueDate: dueDate || undefined })
          setAmount('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="invoice-contact">Contact</label>
          <select id="invoice-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="invoice-amount">Amount</label>
          <input id="invoice-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
        </div>
        <div className="field">
          <label htmlFor="invoice-currency">Currency</label>
          <select id="invoice-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="invoice-tax">Tax rate %</label>
          <input id="invoice-tax" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label htmlFor="invoice-due">Due date</label>
          <input id="invoice-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy || contacts.length === 0}>{busy ? 'Creating…' : 'Create invoice'}</Button></div>
    </form>
  )
}

/** Create a client portal login. The access code is shown once after creation. */
export function CreatePortalAccountForm({ contacts }: { contacts: Option[] }) {
  const { busy, error, submit } = useSubmit()
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState<string | null>(null)

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          const data = await postJson('/api/portal-accounts', { contactId, email })
          if (typeof data.accessCode === 'string') setCode(data.accessCode)
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="portal-contact">Contact</label>
          <select id="portal-contact" value={contactId} onChange={(e) => setContactId(e.target.value)} required>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="portal-email">Portal email</label>
          <input id="portal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      {code ? (
        <div className="notice ok" role="status">
          Portal login created. Access code (shown once — send it to the client):{' '}
          <strong className="mono">{code}</strong>
        </div>
      ) : null}
      <div><Button type="submit" disabled={busy || contacts.length === 0}>{busy ? 'Creating…' : 'Create portal login'}</Button></div>
    </form>
  )
}

/** Create an API key. The full key is shown once after creation. */
export function CreateApiKeyForm() {
  const { busy, error, submit } = useSubmit()
  const [name, setName] = useState('')
  const [key, setKey] = useState<string | null>(null)

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          const data = await postJson('/api/api-keys', { name })
          if (typeof data.key === 'string') setKey(data.key)
          setName('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="apikey-name">Key name</label>
          <input id="apikey-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website integration" required />
        </div>
      </div>
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      {key ? (
        <div className="notice ok" role="status">
          API key created — copy it now, it will not be shown again:
          <br /><code className="mono">{key}</code>
        </div>
      ) : null}
      <div><Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create API key'}</Button></div>
    </form>
  )
}

/** Create a workflow (e.g. deal won → create order). */
export function CreateWorkflowForm() {
  const { busy, error, notice, submit } = useSubmit()
  const [name, setName] = useState('')
  const [trigger, setTrigger] = useState('deal_won')
  const [action, setAction] = useState('create_order')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/workflows', { name, trigger, action })
          setName('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="workflow-name">Workflow name</label>
          <input id="workflow-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="workflow-trigger">When this happens</label>
          <select id="workflow-trigger" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
            <option value="deal_won">Deal is won</option>
            <option value="deal_created">Deal is created</option>
            <option value="order_delivered">Order is delivered</option>
            <option value="ticket_created">Ticket is created</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="workflow-action">Do this</label>
          <select id="workflow-action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="create_order">Create order (+ project)</option>
            <option value="create_task">Create task</option>
            <option value="send_email">Send email</option>
            <option value="create_ticket">Create ticket</option>
          </select>
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create workflow'}</Button></div>
    </form>
  )
}

/** Create a custom field on contacts or deals. */
export function CreateCustomFieldForm() {
  const { busy, error, notice, submit } = useSubmit()
  const [entity, setEntity] = useState('contact')
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')

  return (
    <form
      className="form"
      onSubmit={(e) =>
        submit(e, async () => {
          await postJson('/api/custom-fields', { entity, name, fieldType })
          setName('')
        })
      }
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="cf-entity">Applies to</label>
          <select id="cf-entity" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="contact">Contact</option>
            <option value="deal">Deal</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="cf-name">Field name</label>
          <input id="cf-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="cf-type">Type</label>
          <select id="cf-type" value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select">Select</option>
          </select>
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add custom field'}</Button></div>
    </form>
  )
}

/** White-label settings: brand colour, default currency, default tax rate. */
export function BrandSettingsForm({
  brandColor,
  currency,
  taxRate,
}: {
  brandColor: string
  currency: string
  taxRate: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [color, setColor] = useState(brandColor)
  const [curr, setCurr] = useState(currency)
  const [tax, setTax] = useState(String(taxRate))

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        setNotice(null)
        try {
          await patchJson('/api/settings', { brandColor: color, currency: curr, taxRate: tax })
          setNotice('Brand settings saved.')
          router.refresh()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Request failed')
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="form-row">
        <div className="field">
          <label htmlFor="brand-color">Brand colour</label>
          <input id="brand-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="brand-currency">Default currency</label>
          <select id="brand-currency" value={curr} onChange={(e) => setCurr(e.target.value)}>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="brand-tax">Default tax rate %</label>
          <input id="brand-tax" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
        </div>
      </div>
      <FormStatus error={error} notice={notice} />
      <div><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save brand settings'}</Button></div>
    </form>
  )
}
