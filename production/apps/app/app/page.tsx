import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../lib/tenant'
import { safeQuery } from '../lib/db'
import { formatMoney, formatDate } from '../lib/format'

export const dynamic = 'force-dynamic'

const OPEN_TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT'] as const
const OPEN_PROJECT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'REVIEW'] as const

export default async function DashboardPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const deals = await safeQuery(
    () =>
      prisma.deal.findMany({
        where: tenantWhere(agencyId),
        include: { contact: true },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
    [],
  )
  const revenue = await safeQuery(
    () =>
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { ...tenantWhere(agencyId), status: 'PAID' },
      }),
    { _sum: { amount: null } },
  )
  const openProjects = await safeQuery(
    () =>
      prisma.project.count({
        where: { ...tenantWhere(agencyId), status: { in: [...OPEN_PROJECT_STATUSES] } },
      }),
    0,
  )
  const openTickets = await safeQuery(
    () =>
      prisma.ticket.count({
        where: { ...tenantWhere(agencyId), status: { in: [...OPEN_TICKET_STATUSES] } },
      }),
    0,
  )
  const dbError = deals.dbError || revenue.dbError || openProjects.dbError || openTickets.dbError

  const pipelineValue = deals.data
    .filter((d) => d.stage !== 'WON' && d.stage !== 'LOST')
    .reduce((sum, d) => sum + d.value, 0)
  const wonValue = deals.data.filter((d) => d.stage === 'WON').reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Dashboard</h1>
        <p className="muted">Welcome back, {user.name}. Your pipeline, delivery and support at a glance.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">
          The database is unreachable, so this page is showing an empty workspace. Check
          <code> DATABASE_URL </code>
          and run the Prisma migrations — nothing here was lost, no data is shown.
        </div>
      ) : null}

      <div className="grid grid-4">
        <Card>
          <div className="stat-label">Open pipeline</div>
          <div className="stat-value">{formatMoney(pipelineValue)}</div>
          <div className="small muted">{deals.data.filter((d) => d.stage !== 'WON' && d.stage !== 'LOST').length} open deals</div>
        </Card>
        <Card>
          <div className="stat-label">Won (recent)</div>
          <div className="stat-value">{formatMoney(wonValue)}</div>
          <div className="small muted">from the latest deals</div>
        </Card>
        <Card>
          <div className="stat-label">Open projects</div>
          <div className="stat-value">{openProjects.data}</div>
          <div className="small muted">not started, in progress or in review</div>
        </Card>
        <Card>
          <div className="stat-label">Open tickets</div>
          <div className="stat-value">{openTickets.data}</div>
          <div className="small muted">waiting on the team or the client</div>
        </Card>
        <Card>
          <div className="stat-label">Revenue (paid invoices)</div>
          <div className="stat-value">{formatMoney(revenue.data._sum.amount ?? 0)}</div>
          <div className="small muted">tracking only — no payments are processed here</div>
        </Card>
      </div>

      <Card>
        <div className="spread">
          <h2>Recent deals</h2>
          <Link href="/deals">View pipeline →</Link>
        </div>
        {deals.data.length === 0 ? (
          <EmptyState title="No deals yet" body="Add your first deal from the Deals page to start the pipeline." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Deal</th><th>Contact</th><th>Stage</th><th>Value</th><th>Updated</th></tr>
              </thead>
              <tbody>
                {deals.data.map((d) => (
                  <tr key={d.id}>
                    <td>{d.title}</td>
                    <td>{d.contact.firstName} {d.contact.lastName}</td>
                    <td><Badge tone={d.stage === 'WON' ? 'success' : d.stage === 'LOST' ? 'danger' : 'brand'}>{d.stage}</Badge></td>
                    <td>{formatMoney(d.value, d.currency)}</td>
                    <td>{formatDate(d.updatedAt)}</td>
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
