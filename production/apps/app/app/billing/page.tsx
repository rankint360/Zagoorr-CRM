import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatMoney, formatDate } from '../../lib/format'
import { CreateInvoiceForm } from '../components/forms'

export const dynamic = 'force-dynamic'

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'neutral',
  SENT: 'brand',
  PAID: 'success',
  OVERDUE: 'danger',
  VOID: 'neutral',
}

export default async function BillingPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: invoices, dbError } = await safeQuery(
    () =>
      prisma.invoice.findMany({
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

  const totalByStatus = (status: string) =>
    invoices.filter((i) => i.status === status).reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Billing — invoices</h1>
        <p className="muted">Tracking only: invoices record amounts and status. No payment provider is wired in and no charges are made.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so invoices cannot be listed right now.</div>
      ) : null}

      <div className="grid grid-4">
        {(['DRAFT', 'SENT', 'PAID', 'OVERDUE'] as const).map((s) => (
          <Card key={s}>
            <div className="stat-label">{s}</div>
            <div className="stat-value">{formatMoney(totalByStatus(s))}</div>
            <div className="small muted">{invoices.filter((i) => i.status === s).length} invoices</div>
          </Card>
        ))}
      </div>

      <Card>
        <h2>Create an invoice</h2>
        {contacts.length === 0 ? (
          <EmptyState title="Add a contact first" body="Invoices need a contact — create one from the Contacts page." />
        ) : (
          <CreateInvoiceForm contacts={contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName} (${c.email})` }))} />
        )}
      </Card>

      <Card>
        <h2>All invoices ({invoices.length})</h2>
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" body="Create your first invoice above — amounts, currency and tax are tracked, never charged." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Number</th><th>Client</th><th>Order</th><th>Status</th><th>Amount</th><th>Tax</th><th>Due</th><th>Created</th></tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const taxAmount = Math.round((inv.amount * inv.taxRate) / 100)
                  return (
                    <tr key={inv.id}>
                      <td>{inv.number}</td>
                      <td><Link href={`/contacts/${inv.contact.id}`}>{inv.contact.firstName} {inv.contact.lastName}</Link></td>
                      <td>{inv.order?.service.name ?? '—'}</td>
                      <td><Badge tone={STATUS_TONE[inv.status] ?? 'neutral'}>{inv.status}</Badge></td>
                      <td>
                        {formatMoney(inv.amount, inv.currency)}
                        {inv.taxRate > 0 ? <span className="small muted"> + {formatMoney(taxAmount, inv.currency)} tax</span> : null}
                      </td>
                      <td>{inv.taxRate}%</td>
                      <td>{formatDate(inv.dueDate)}</td>
                      <td>{formatDate(inv.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
