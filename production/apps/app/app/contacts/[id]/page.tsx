import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma, type Activity, type Deal, type Order, type Ticket } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../../lib/tenant'
import { formatMoney, formatDate } from '../../../lib/format'
import { AddActivityForm } from '../../components/forms'

export const dynamic = 'force-dynamic'

const TICKET_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  OPEN: 'brand',
  IN_PROGRESS: 'warning',
  WAITING_CLIENT: 'neutral',
  RESOLVED: 'success',
  CLOSED: 'success',
}

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const contact = await prisma.contact
    .findFirst({
      where: { id: params.id, ...tenantWhere(agencyId) },
      include: {
        company: true,
        activities: { orderBy: { createdAt: 'desc' } },
        deals: { orderBy: { createdAt: 'desc' } },
        orders: { include: { service: true }, orderBy: { createdAt: 'desc' } },
        tickets: { orderBy: { createdAt: 'desc' } },
      },
    })
    .catch(() => null)
  if (!contact) notFound()

  return (
    <div className="stack">
      <div className="page-head">
        <p className="muted"><Link href="/contacts">← All contacts</Link></p>
        <h1>{contact.firstName} {contact.lastName}</h1>
        <p className="muted">
          {contact.email}
          {contact.phone ? ` · ${contact.phone}` : ''}
          {contact.company ? ` · ${contact.company.name}` : ''}
        </p>
        {contact.notes ? <p>{contact.notes}</p> : null}
      </div>

      <div className="grid grid-2">
        <Card>
          <h2>Deals ({contact.deals.length})</h2>
          {contact.deals.length === 0 ? (
            <EmptyState title="No deals" body="Create a deal for this contact from the Deals page." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Deal</th><th>Stage</th><th>Value</th></tr></thead>
                <tbody>
                  {contact.deals.map((d: Deal) => (
                    <tr key={d.id}>
                      <td>{d.title}</td>
                      <td><Badge tone={d.stage === 'WON' ? 'success' : d.stage === 'LOST' ? 'danger' : 'brand'}>{d.stage}</Badge></td>
                      <td>{formatMoney(d.value, d.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2>Orders ({contact.orders.length})</h2>
          {contact.orders.length === 0 ? (
            <EmptyState title="No orders" body="Orders are created when a deal is won." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Service</th><th>Status</th><th>Amount</th></tr></thead>
                <tbody>
                  {contact.orders.map((o: Order) => (
                    <tr key={o.id}>
                      <td>{o.service.name}</td>
                      <td><Badge tone={o.status === 'CANCELLED' ? 'danger' : o.status === 'DELIVERED' ? 'success' : 'brand'}>{o.status}</Badge></td>
                      <td>{formatMoney(o.amount, o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2>Support tickets ({contact.tickets.length})</h2>
        {contact.tickets.length === 0 ? (
          <EmptyState title="No tickets" body="Nothing raised by this contact yet." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Subject</th><th>Status</th><th>Priority</th><th>Opened</th></tr></thead>
              <tbody>
                {contact.tickets.map((t: Ticket) => (
                  <tr key={t.id}>
                    <td><Link href={`/tickets/${t.id}`}>{t.subject}</Link></td>
                    <td><Badge tone={TICKET_TONE[t.status] ?? 'neutral'}>{t.status}</Badge></td>
                    <td>{t.priority}</td>
                    <td>{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2>Activity timeline</h2>
        {contact.activities.length === 0 ? (
          <EmptyState title="No activity yet" body="Calls, emails, meetings and notes for this contact will appear here." />
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {contact.activities.map((a: Activity) => (
              <li key={a.id} style={{ borderBottom: '1px solid #E6EAF0', padding: '12px 0' }}>
                <strong>{a.title}</strong>{' '}
                <span className="small muted">{a.type} · {formatDate(a.createdAt)}</span>
                {a.body ? <p style={{ margin: '4px 0 0' }}>{a.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 16 }}>
          <h3>Add activity</h3>
          <AddActivityForm contactId={contact.id} />
        </div>
      </Card>
    </div>
  )
}
