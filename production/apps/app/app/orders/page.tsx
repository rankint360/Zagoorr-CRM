import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatMoney, formatDate } from '../../lib/format'
import { CreateOrderForm } from '../components/forms'
import { CancelOrderButton } from '../components/actions'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: orders, dbError } = await safeQuery(
    () =>
      prisma.order.findMany({
        where: tenantWhere(agencyId),
        include: { contact: true, service: true, deal: true },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: contacts } = await safeQuery(
    () => prisma.contact.findMany({ where: tenantWhere(agencyId), orderBy: { firstName: 'asc' } }),
    [],
  )
  const { data: services } = await safeQuery(
    () =>
      prisma.service.findMany({
        where: { OR: [{ agencyId }, { agencyId: null }], active: true },
        orderBy: { name: 'asc' },
      }),
    [],
  )

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Orders</h1>
        <p className="muted">Orders are created when a deal is won — or manually here. Intake and delivery live on the project.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so orders cannot be listed right now.</div>
      ) : null}

      <Card>
        <h2>Create an order</h2>
        {contacts.length === 0 || services.length === 0 ? (
          <EmptyState
            title="Contacts and services are needed first"
            body="Add a contact from the Contacts page. Services (Digital Marketing, SEO, Link Building) are seeded for a new agency."
          />
        ) : (
          <CreateOrderForm
            contacts={contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName} (${c.email})` }))}
            services={services.map((s) => ({ id: s.id, label: s.name }))}
          />
        )}
      </Card>

      <Card>
        <h2>All orders ({orders.length})</h2>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" body="Win a deal and its order appears here automatically." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Service</th><th>Client</th><th>Deal</th><th>Status</th><th>Amount</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.service.name}</td>
                    <td><Link href={`/contacts/${o.contact.id}`}>{o.contact.firstName} {o.contact.lastName}</Link></td>
                    <td>{o.deal?.title ?? '—'}</td>
                    <td><Badge tone={o.status === 'CANCELLED' ? 'danger' : o.status === 'DELIVERED' ? 'success' : 'brand'}>{o.status}</Badge></td>
                    <td>{formatMoney(o.amount, o.currency)}</td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.status !== 'CANCELLED' && o.status !== 'DELIVERED' ? <CancelOrderButton orderId={o.id} /> : null}</td>
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
