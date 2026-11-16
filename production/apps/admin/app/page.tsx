import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge, Card, EmptyState } from '@zagoorr/ui'
import { prisma } from '@zagoorr/db'
import { getPlatformSession } from '../lib/admin'
import { agencyStatusTone, formatDate, formatMoney } from '../lib/format'

export const dynamic = 'force-dynamic'

// Platform overview. All figures are computed live from the database.
// Production starts fresh/empty, so the empty state is the normal first view.
// MRR here = PAID invoice amounts in the last 30 days (tracking only —
// payments are on hold, so this is recorded revenue, not a payment feed).
// Outstanding = SENT + OVERDUE invoice amounts. Mixed currencies are summed
// as minor units; proper multi-currency reporting is a follow-up.
export default async function OverviewPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [agencyCount, userCount, byStatus, paidRecent, outstanding, recentAgencies, recentAudit] =
    await Promise.all([
      prisma.agency.count(),
      prisma.user.count(),
      prisma.agency.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.invoice.findMany({
        where: { status: 'PAID', createdAt: { gte: thirtyDaysAgo } },
        select: { amount: true },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ['SENT', 'OVERDUE'] } },
        select: { amount: true },
      }),
      prisma.agency.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { plan: true, _count: { select: { users: true } } },
      }),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ])

  const mrr = paidRecent.reduce((sum, inv) => sum + inv.amount, 0)
  const outstandingTotal = outstanding.reduce((sum, inv) => sum + inv.amount, 0)
  const statusCounts: Record<string, number> = {}
  for (const row of byStatus) statusCounts[row.status] = row._count._all

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Platform overview</h1>
          <p className="muted">Zagoorr platform at a glance — agencies, users, and billing (tracking only).</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Agencies</div>
          <div className="stat-value">{agencyCount}</div>
          <div className="stat-sub">
            {statusCounts.ACTIVE ?? 0} active · {statusCounts.TRIAL ?? 0} trial ·{' '}
            {statusCounts.SUSPENDED ?? 0} suspended · {statusCounts.CANCELLED ?? 0} cancelled
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Users</div>
          <div className="stat-value">{userCount}</div>
          <div className="stat-sub">Platform staff + agency teams + portal users</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">MRR (paid, last 30 days)</div>
          <div className="stat-value">{formatMoney(mrr)}</div>
          <div className="stat-sub">Recorded paid invoices — no payment provider wired in</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding billing</div>
          <div className="stat-value">{formatMoney(outstandingTotal)}</div>
          <div className="stat-sub">Sent + overdue invoices</div>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Newest agencies</h2>
          <Link href="/agencies">Manage agencies →</Link>
        </div>
        <Card style={{ padding: 8 }}>
          {recentAgencies.length === 0 ? (
            <EmptyState
              title="No agencies yet"
              body="Production starts fresh. Create the first agency from the Agencies page."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Users</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAgencies.map((agency) => (
                    <tr key={agency.id}>
                      <td>
                        <strong>{agency.name}</strong>
                        <div className="muted small">{agency.slug}.portal.zagoorr.com</div>
                      </td>
                      <td>{agency.plan?.name ?? '—'}</td>
                      <td>
                        <Badge tone={agencyStatusTone(agency.status)}>{agency.status}</Badge>
                      </td>
                      <td>{agency._count.users}</td>
                      <td>{formatDate(agency.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Recent platform activity</h2>
          <Link href="/audit">Full audit trail →</Link>
        </div>
        <Card style={{ padding: 8 }}>
          {recentAudit.length === 0 ? (
            <EmptyState title="No audit entries yet" body="Admin actions are recorded here as they happen." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Detail</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudit.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.action}</strong>
                        {entry.entity ? <div className="muted small">{entry.entity}</div> : null}
                      </td>
                      <td>{entry.actorName ?? '—'}</td>
                      <td>{entry.detail ?? '—'}</td>
                      <td>{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
