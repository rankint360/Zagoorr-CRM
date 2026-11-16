import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../../lib/tenant'
import { formatDate } from '../../../lib/format'
import { TicketStatusSelect } from '../../components/actions'

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const ticket = await prisma.ticket
    .findFirst({
      where: { id: params.id, ...tenantWhere(agencyId) },
      include: { contact: true, order: { include: { service: true } } },
    })
    .catch(() => null)
  if (!ticket) notFound()

  // AI assists are placeholders in v1: no live AI call is made. The draft
  // below is derived only from the ticket text already on this record.
  const draftSummary = ticket.aiSummary ?? (ticket.body
    ? `Client reports: ${ticket.body.slice(0, 240)}${ticket.body.length > 240 ? '…' : ''}`
    : 'No details provided yet — ask the client for more information.')

  return (
    <div className="stack">
      <div className="page-head">
        <p className="muted"><Link href="/tickets">← All tickets</Link></p>
        <h1>{ticket.subject}</h1>
        <p className="muted">
          From <Link href={`/contacts/${ticket.contact.id}`}>{ticket.contact.firstName} {ticket.contact.lastName}</Link>
          {ticket.order ? ` · order: ${ticket.order.service.name}` : ''}
          {` · opened ${formatDate(ticket.createdAt)}`}
        </p>
      </div>

      <div className="grid grid-2">
        <Card>
          <h2>Details</h2>
          <p><strong>Status:</strong> <Badge>{ticket.status}</Badge></p>
          <p><strong>Priority:</strong> {ticket.priority}</p>
          <p>{ticket.body ?? 'No details provided.'}</p>
          <div className="field">
            <label htmlFor="ticket-status">Change status</label>
            <TicketStatusSelect ticketId={ticket.id} status={ticket.status} />
          </div>
        </Card>

        <Card>
          <h2>AI summary — draft</h2>
          <p className="small muted">AI draft — review before sending. No live AI call is made in v1.</p>
          <p>{draftSummary}</p>
          <div className="field">
            <label htmlFor="ticket-reply">Reply draft (review before sending)</label>
            <textarea
              id="ticket-reply"
              readOnly
              value={`Hi ${ticket.contact.firstName},\n\nThanks for raising this — we're looking into "${ticket.subject}" now and will update you shortly.\n\nBest,\n${user.name}`}
            />
          </div>
          <p className="small muted">Sending replies is not wired up in v1 — copy the draft into your email.</p>
        </Card>
      </div>
    </div>
  )
}
