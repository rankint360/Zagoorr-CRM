import { redirect } from 'next/navigation'
import { prisma, type Task } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatMoney } from '../../lib/format'

export const dynamic = 'force-dynamic'

const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const

export default async function ReportsPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: deals, dbError } = await safeQuery(
    () => prisma.deal.findMany({ where: tenantWhere(agencyId) }),
    [],
  )
  const { data: projects } = await safeQuery(
    () => prisma.project.findMany({ where: tenantWhere(agencyId), include: { tasks: true } }),
    [],
  )
  const { data: invoices } = await safeQuery(
    () => prisma.invoice.findMany({ where: tenantWhere(agencyId) }),
    [],
  )

  const won = deals.filter((d) => d.stage === 'WON')
  const lost = deals.filter((d) => d.stage === 'LOST')
  const closed = won.length + lost.length
  const winRate = closed === 0 ? 0 : Math.round((won.length / closed) * 100)
  const allTasks = projects.flatMap((p) => p.tasks)
  const doneTasks = allTasks.filter((t) => t.status === 'DONE').length
  const taskRate = allTasks.length === 0 ? 0 : Math.round((doneTasks / allTasks.length) * 100)
  const paidTotal = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const outstandingTotal = invoices
    .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
    .reduce((s, i) => s + i.amount, 0)

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Reports</h1>
        <p className="muted">Live numbers from your own records — funnel, win rate, delivery and billing.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so reports are showing empty data.</div>
      ) : null}

      <div className="grid grid-4">
        <Card>
          <div className="stat-label">Win rate</div>
          <div className="stat-value">{winRate}%</div>
          <div className="small muted">{won.length} won · {lost.length} lost</div>
        </Card>
        <Card>
          <div className="stat-label">Task completion</div>
          <div className="stat-value">{taskRate}%</div>
          <div className="small muted">{doneTasks} of {allTasks.length} tasks done</div>
        </Card>
        <Card>
          <div className="stat-label">Paid invoices</div>
          <div className="stat-value">{formatMoney(paidTotal)}</div>
          <div className="small muted">tracking only</div>
        </Card>
        <Card>
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{formatMoney(outstandingTotal)}</div>
          <div className="small muted">sent + overdue invoices</div>
        </Card>
      </div>

      <Card>
        <h2>Sales funnel</h2>
        {deals.length === 0 ? (
          <EmptyState title="No deals to report on yet" body="Add deals and they will appear in the funnel here." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Stage</th><th>Deals</th><th>Value</th><th>Share</th></tr></thead>
              <tbody>
                {STAGES.map((stage) => {
                  const inStage = deals.filter((d) => d.stage === stage)
                  const value = inStage.reduce((s, d) => s + d.value, 0)
                  return (
                    <tr key={stage}>
                      <td>{stage}</td>
                      <td>{inStage.length}</td>
                      <td>{formatMoney(value)}</td>
                      <td>{deals.length === 0 ? '—' : `${Math.round((inStage.length / deals.length) * 100)}%`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2>Delivery by project</h2>
        {projects.length === 0 ? (
          <EmptyState title="No projects yet" body="Projects appear here once deals are won." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Project</th><th>Status</th><th>Tasks done</th><th>Completion</th></tr></thead>
              <tbody>
                {projects.map((p) => {
                  const done = p.tasks.filter((t: Task) => t.status === 'DONE').length
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.status}</td>
                      <td>{done} / {p.tasks.length}</td>
                      <td>{p.tasks.length === 0 ? '—' : `${Math.round((done / p.tasks.length) * 100)}%`}</td>
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
