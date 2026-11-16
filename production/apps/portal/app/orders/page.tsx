import { redirect } from 'next/navigation'
import { Badge, Card, EmptyState } from '@zagoorr/ui'
import { getPortalContext } from '../../lib/tenant'
import type { Task } from '@zagoorr/db'
import { getOwnOrders } from '../../lib/portal-data'
import { formatDate, formatMoney, taskProgress } from '../../lib/format'

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

/** The client's own orders, with delivery progress from project tasks. */
export default async function OrdersPage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')

  const orders = await getOwnOrders(ctx)

  return (
    <>
      <h1>Your orders</h1>
      <p className="lede">Track delivery progress on every order {ctx.agency.name} is fulfilling for you.</p>

      {orders.length === 0 ? (
        <Card>
          <EmptyState title="No orders yet" body="Orders your agency places for you will show up here." />
        </Card>
      ) : (
        <div className="stack">
          {orders.map((order) => {
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
                    {tasks.length > 0 ? (
                      <ul className="task-list">
                        {tasks.map((task: Task) => (
                          <li key={task.id} className={task.status === 'DONE' ? 'done' : undefined}>
                            {task.status === 'DONE' ? '✓ ' : '○ '}
                            {task.title}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                ) : (
                  <p className="progress-label">Delivery hasn&apos;t started yet.</p>
                )}
                {order.status === 'INTAKE' || order.status === 'DRAFT' ? (
                  <p style={{ marginTop: 12 }}>
                    <a href="/intake">Complete your intake →</a>
                  </p>
                ) : null}
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
