import { redirect } from 'next/navigation'
import { prisma, type Task } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { CreateProjectForm, AddTaskForm } from '../components/forms'
import { TaskToggle } from '../components/actions'

export const dynamic = 'force-dynamic'

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger'> = {
  NOT_STARTED: 'neutral',
  IN_PROGRESS: 'brand',
  REVIEW: 'warning',
  DONE: 'success',
  CANCELLED: 'danger',
}

export default async function ProjectsPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: projects, dbError } = await safeQuery(
    () =>
      prisma.project.findMany({
        where: tenantWhere(agencyId),
        include: {
          tasks: { orderBy: { createdAt: 'asc' } },
          order: { include: { service: true, contact: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: orders } = await safeQuery(
    () =>
      prisma.order.findMany({
        where: { ...tenantWhere(agencyId), status: { not: 'CANCELLED' } },
        include: { service: true, contact: true },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: templates } = await safeQuery(
    () =>
      prisma.deliveryTemplate.findMany({
        where: { service: { OR: [{ agencyId }, { agencyId: null }] } },
        include: { service: true },
        orderBy: { name: 'asc' },
      }),
    [],
  )

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Projects — delivery</h1>
        <p className="muted">One project per order. Tasks track delivery; templates seed the checklist for each service.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so projects cannot be listed right now.</div>
      ) : null}

      <Card>
        <h2>Create a project</h2>
        <CreateProjectForm
          orders={orders.map((o) => ({ id: o.id, label: `${o.service.name} — ${o.contact.firstName} ${o.contact.lastName}` }))}
        />
      </Card>

      {projects.length === 0 ? (
        <Card><EmptyState title="No projects yet" body="Projects are created automatically when a deal is won." /></Card>
      ) : (
        projects.map((p) => {
          const done = p.tasks.filter((t: Task) => t.status === 'DONE').length
          return (
            <Card key={p.id}>
              <div className="spread">
                <div>
                  <h2>{p.name}</h2>
                  <p className="muted small">
                    {p.order ? `${p.order.service.name} for ${p.order.contact.firstName} ${p.order.contact.lastName}` : 'Standalone project'}
                    {p.dueDate ? ` · due ${formatDate(p.dueDate)}` : ''}
                  </p>
                </div>
                <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{p.status}</Badge>
              </div>
              <p className="small muted">{done} of {p.tasks.length} tasks done</p>
              {p.tasks.length === 0 ? (
                <EmptyState title="No tasks yet" body="Add the first delivery task below, or apply a delivery template." />
              ) : (
                <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0 }}>
                  {p.tasks.map((t: Task) => (
                    <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #E6EAF0' }}>
                      <TaskToggle taskId={t.id} done={t.status === 'DONE'} />
                      <span style={t.status === 'DONE' ? { textDecoration: 'line-through', color: '#5B6B7F' } : undefined}>
                        {t.title}
                      </span>
                      <span className="small muted">{t.status}</span>
                    </li>
                  ))}
                </ul>
              )}
              <AddTaskForm projectId={p.id} />
            </Card>
          )
        })
      )}

      <Card>
        <h2>Delivery templates</h2>
        {templates.length === 0 ? (
          <EmptyState
            title="No delivery templates yet"
            body="Templates are checklists per service (Digital Marketing, SEO, Link Building) — add them once services are seeded."
          />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Template</th><th>Service</th><th>Tasks</th></tr></thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>{t.service.name}</td>
                    <td>{Array.isArray(t.tasks) ? t.tasks.length : 0}</td>
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
