import { redirect } from 'next/navigation'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatMoney } from '../../lib/format'
import { CreateDealForm } from '../components/forms'
import { DealStageButtons } from '../components/actions'

export const dynamic = 'force-dynamic'

const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'] as const

export default async function DealsPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: deals, dbError } = await safeQuery(
    () =>
      prisma.deal.findMany({
        where: tenantWhere(agencyId),
        include: { contact: true, service: true },
        orderBy: { updatedAt: 'desc' },
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
        <h1>Deals — pipeline</h1>
        <p className="muted">Marking a deal Won creates its order and delivery project automatically.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so the pipeline cannot be listed right now.</div>
      ) : null}

      <Card>
        <h2>Add a deal</h2>
        {contacts.length === 0 ? (
          <EmptyState title="Add a contact first" body="Deals need a contact — create one from the Contacts page." />
        ) : (
          <CreateDealForm
            contacts={contacts.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName} (${c.email})` }))}
            services={services.map((s) => ({ id: s.id, label: s.name }))}
          />
        )}
      </Card>

      {deals.length === 0 ? (
        <Card><EmptyState title="No deals yet" body="Your pipeline is empty — add a deal above to get started." /></Card>
      ) : (
        <div className="board">
          {STAGES.map((stage) => {
            const inStage = deals.filter((d) => d.stage === stage)
            const total = inStage.reduce((sum, d) => sum + d.value, 0)
            return (
              <section className="board-col" key={stage} aria-label={`${stage} deals`}>
                <h3>{stage}</h3>
                <p className="small muted">{inStage.length} deal{inStage.length === 1 ? '' : 's'} · {formatMoney(total)}</p>
                {inStage.map((d) => (
                  <article className="deal-card" key={d.id}>
                    <p><strong>{d.title}</strong></p>
                    <p className="small muted">
                      {d.contact.firstName} {d.contact.lastName}
                      {d.service ? ` · ${d.service.name}` : ''}
                    </p>
                    <p>{formatMoney(d.value, d.currency)}</p>
                    <DealStageButtons dealId={d.id} stage={d.stage} />
                  </article>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
