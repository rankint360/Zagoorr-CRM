import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { CreateTicketForm } from '../components/forms'

export const dynamic = 'force-dynamic'

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  OPEN: 'brand',
  IN_PROGRESS: 'warning',
  WAITING_CLIENT: 'neutral',
  RESOLVED: 'success',
  CLOSED: 'success',
}

const PRIORITY_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  LOW: 'neutral',
  NORMAL: 'neutral',
  HIGH: 'warning',
  URGENT: 'danger',
}

export default async function TicketsPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: tickets, dbError } = await safeQuery(
    () =>
      prisma.ticket.findMany({
        where: tenantWhere(agencyId),
        include: { contact: true, order: { include: { service: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: contacts } = await safeQuery(
    () => prisma.contact.findMany({ where: tenantWhere(agencyId), orderBy: { firstName: 'asc' } }),
    [],
  )

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Support tickets</h1>
        <p className="muted">Client questions and issues, tied to the same client record as deals and orders.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so tickets cannot be listed right now.</div>
      ) : null}

      <Card>
        <h2>Raise a ticket</h2>
        {contacts.length === 0 ? (
          <EmptyState title="Add a contact first" body="Tickets need a contact — create one from the Contacts page." />
        ) : (
          <CreateTicketForm contacts={contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName} (${c.email})` }))} />
        )}
      </Card>

      <Card>
        <h2>All tickets ({tickets.length})</h2>
        {tickets.length === 0 ? (
          <EmptyState title="No tickets yet" body="Nothing raised — when a client needs help, it lands here." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Subject</th><th>Client</th><th>Order</th><th>Status</th><th>Priority</th><th>Opened</th></tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td><Link href={`/tickets/${t.id}`}>{t.subject}</Link></td>
                    <td>{t.contact.firstName} {t.contact.lastName}</td>
                    <td>{t.order?.service.name ?? '—'}</td>
                    <td><Badge tone={STATUS_TONE[t.status] ?? 'neutral'}>{t.status}</Badge></td>
                    <td><Badge tone={PRIORITY_TONE[t.priority] ?? 'neutral'}>{t.priority}</Badge></td>
                    <td>{formatDate(t.createdAt)}</td>
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
