import { redirect } from 'next/navigation'
import { Badge, Card, EmptyState } from '@zagoorr/ui'
import { getPortalContext } from '../../lib/tenant'
import { getOwnInvoices } from '../../lib/portal-data'
import { formatDate, formatMoney } from '../../lib/format'

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

/**
 * The client's own invoices — VIEW-ONLY. Payments are on hold
 * (Decision 3): no checkout, no Stripe, no pay button anywhere.
 */
export default async function InvoicesPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')

  const invoices = await getOwnInvoices(ctx)

  return (
    <>
      <h1>Your invoices</h1>
      <p className="lede">All invoices {ctx.agency.name} has issued to you.</p>
      <p className="notice">
        Invoices are view-only and for tracking. Online payments are not enabled — if you need to pay an
        invoice, contact {ctx.agency.name} directly.
      </p>

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
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.number}</td>
                    <td>{inv.order?.service.name ?? '—'}</td>
                    <td>{formatMoney(inv.amount, inv.currency)}</td>
                    <td>
                      <Badge tone={invoiceTone(inv.status)}>{inv.status}</Badge>
                    </td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>{formatDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
