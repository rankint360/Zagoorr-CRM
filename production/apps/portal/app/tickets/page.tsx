import { redirect } from 'next/navigation'
import { Badge, Card, EmptyState } from '@zagoorr/ui'
import { getPortalContext } from '../../lib/tenant'
import { getOwnOrders, getOwnTickets } from '../../lib/portal-data'
import { formatDate } from '../../lib/format'
import RaiseTicketForm from '../../components/RaiseTicketForm'

function ticketTone(status: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'RESOLVED':
    case 'CLOSED':
      return 'success'
    case 'IN_PROGRESS':
      return 'brand'
    case 'WAITING_CLIENT':
      return 'warning'
    case 'OPEN':
      return 'danger'
    default:
      return 'neutral'
  }
}

/** The client's own tickets, plus the raise-a-ticket form. */
export default async function TicketsPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')

  const [tickets, orders] = await Promise.all([getOwnTickets(ctx), getOwnOrders(ctx)])

  return (
    <>
      <h1>Support tickets</h1>
      <p className="lede">Ask {ctx.agency.name} for help with an order, or follow up on an open ticket.</p>

      <Card>
        <h2 style={{ marginTop: 0 }}>Raise a ticket</h2>
        <RaiseTicketForm
          orders={orders.map((o) => ({ id: o.id, label: `${o.service.name} — ${formatDate(o.createdAt)}` }))}
        />
      </Card>

      <div className="stack" style={{ marginTop: 32 }}>
        <h2 style={{ margin: 0 }}>Your tickets</h2>
        {tickets.length === 0 ? (
          <Card>
            <EmptyState title="No tickets yet" body="Tickets you raise will show up here." />
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card key={ticket.id}>
              <div className="row">
                <p className="card-title">{ticket.subject}</p>
                <Badge tone={ticketTone(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
              </div>
              {ticket.body ? <p style={{ margin: '8px 0 0' }}>{ticket.body}</p> : null}
              <p className="card-sub" style={{ marginTop: 8 }}>
                Opened {formatDate(ticket.createdAt)}
                {ticket.order ? ` · ${ticket.order.service.name}` : ''}
                {ticket.priority !== 'NORMAL' ? ` · Priority: ${ticket.priority}` : ''}
              </p>
            </Card>
          ))
        )}
      </div>
    </>
  )
}
