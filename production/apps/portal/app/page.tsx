import { Badge, Card, EmptyState } from '@zagoorr/ui'
import { getPortalContext, getRequestAgency } from '../lib/tenant'
import { getOwnInvoices, getOwnOrders, getOwnTickets } from '../lib/portal-data'
import { formatDate, formatMoney, taskProgress } from '../lib/format'
import LoginForm from '../components/LoginForm'

function orderTone(status: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'DELIVERED':
      return 'success'
    case 'IN_PROGRESS':
      return 'brand'
    case 'CANCELLED':
      return 'danger'
    case 'INTAKE':
      return 'warning'
    default:
      return 'neutral'
  }
}

function invoiceTone(status: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'OVERDUE':
      return 'danger'
    case 'SENT':
      return 'brand'
    case 'VOID':
      return 'neutral'
    default:
      return 'neutral'
  }
}

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

/**
 * Portal home. Logged out → email + access code login form.
 * Logged in → the client's own orders (with delivery progress),
 * invoices and tickets. Nothing here is ever cross-client or
 * cross-agency: all queries filter by agencyId + contactId.
 */
export default async function PortalHome() {
  const ctx = await getPortalContext()

  if (!ctx) {
    const agency = await getRequestAgency()
    if (!agency) {
      return (
        <Card>
          <EmptyState
            title="Portal not found"
            body="We couldn't find a client portal for this address. Check the link your agency sent you, or contact them directly."
          />
        </Card>
      )
    }
    return (
      <>
        <h1>Welcome to the {agency.name} client portal</h1>
        <p className="lede">
          Track your orders and delivery progress, view your invoices, and raise support tickets — all in one place.
        </p>
        <LoginForm agencyName={agency.name} />
      </>
    )
  }

  const [orders, invoices, tickets] = await Promise.all([
    getOwnOrders(ctx),
    getOwnInvoices(ctx),
    getOwnTickets(ctx),
  ])

  return (
    <>
      <h1>Welcome back, {ctx.user.name}</h1>
      <p className="lede">
        Here is the latest on your orders with {ctx.agency.name}.
      </p>

      <section className="stack" aria-label="Your orders">
        <div className="row">
          <h2 style={{ margin: 0 }}>Your orders</h2>
          <a href="/orders">View all →</a>
        </div>
        {orders.length === 0 ? (
          <Card>
            <EmptyState title="No orders yet" body="Orders your agency places for you will show up here." />
          </Card>
        ) : (
          orders.slice(0, 3).map((order) => {
            const tasks = order.project?.tasks ?? []
            const progress = taskProgress(tasks)
            return (
              <Card key={order.id}>
                <div className="row">
                  <p className="card-title">{order.service.name}</p>
                  <Badge tone={orderTone(order.status)}>{order.status.replace('_', ' ')}</Badge>
                </div>
                <p className="card-sub">
                  Ordered {formatDate(order.createdAt)} · {formatMoney(order.amount, order.currency)}
                </p>
                {order.project ? (
                  <>
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuenow={progress.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Delivery progress for ${order.service.name}`}
                    >
                      <span style={{ width: `${progress.pct}%` }} />
                    </div>
                    <p className="progress-label">
                      {order.project.name} — {progress.done} of {progress.total} delivery steps done (
                      {progress.pct}%)
                    </p>
                  </>
                ) : (
                  <p className="progress-label">Delivery hasn&apos;t started yet.</p>
                )}
              </Card>
            )
          })
        )}
      </section>

      <section className="stack" style={{ marginTop: 32 }} aria-label="Your invoices">
        <div className="row">
          <h2 style={{ margin: 0 }}>Recent invoices</h2>
          <a href="/invoices">View all →</a>
        </div>
        {invoices.length === 0 ? (
          <Card>
            <EmptyState title="No invoices yet" body="Invoices for your orders will appear here." />
          </Card>
        ) : (
          <Card>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.number}</td>
                      <td>{formatMoney(inv.amount, inv.currency)}</td>
                      <td>
                        <Badge tone={invoiceTone(inv.status)}>{inv.status}</Badge>
                      </td>
                      <td>{formatDate(inv.dueDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="card-sub" style={{ marginTop: 12 }}>
              Invoices are view-only — online payments are not enabled.
            </p>
          </Card>
        )}
      </section>

      <section className="stack" style={{ marginTop: 32 }} aria-label="Your tickets">
        <div className="row">
          <h2 style={{ margin: 0 }}>Support tickets</h2>
          <a href="/tickets">View all / raise one →</a>
        </div>
        {tickets.length === 0 ? (
          <Card>
            <EmptyState title="No tickets yet" body="Raise a ticket any time you need help with an order." />
          </Card>
        ) : (
          tickets.slice(0, 5).map((ticket) => (
            <Card key={ticket.id}>
              <div className="row">
                <p className="card-title">{ticket.subject}</p>
                <Badge tone={ticketTone(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
              </div>
              <p className="card-sub">
                Opened {formatDate(ticket.createdAt)}
                {ticket.order ? ` · ${ticket.order.service.name}` : ''}
              </p>
            </Card>
          ))
        )}
      </section>
    </>
  )
}
