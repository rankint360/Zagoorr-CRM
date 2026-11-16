import { redirect } from 'next/navigation'
import { Badge, Card, EmptyState } from '@zagoorr/ui'
import { prisma } from '@zagoorr/db'
import { getPlatformSession } from '../../lib/admin'
import { formatDate } from '../../lib/format'

export const dynamic = 'force-dynamic'

/** Audit trail — every admin write is recorded via writeAudit (lib/admin.ts). */
export default async function AuditPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { agency: { select: { name: true } } },
  })

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Audit trail</h1>
          <p className="muted">Latest 100 platform admin actions, newest first.</p>
        </div>
      </div>
      <Card style={{ padding: 8 }}>
        {entries.length === 0 ? (
          <EmptyState title="No audit entries yet" body="Admin actions — agency changes, role changes, flag toggles, settings — are recorded here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Agency</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(entry.createdAt)}</td>
                    <td>
                      <strong>{entry.action}</strong>
                      {entry.entity ? (
                        <div className="muted small">
                          {entry.entity}
                          {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ''}
                        </div>
                      ) : null}
                    </td>
                    <td>{entry.actorName ?? '—'}</td>
                    <td>{entry.agency?.name ?? '—'}</td>
                    <td>{entry.detail ?? '—'}</td>
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
