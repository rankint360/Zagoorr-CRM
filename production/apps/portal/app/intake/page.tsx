import { redirect } from 'next/navigation'
import { Card, EmptyState } from '@zagoorr/ui'
import { getPortalContext } from '../../lib/tenant'
import { getOwnOrders } from '../../lib/portal-data'
import { formatDate } from '../../lib/format'
import IntakeForm from '../../components/IntakeForm'

/**
 * Intake: the client answers the agency's onboarding questions for an
 * order. Only orders in DRAFT/INTAKE are listed — delivered or
 * in-progress orders don't need intake. Saved to order.intakeData.
 */
export default async function IntakePage() {
  const ctx = await getPortalContext()
  if (!ctx) redirect('/login')

  const orders = await getOwnOrders(ctx)
  const openOrders = orders.filter((o) => o.status === 'DRAFT' || o.status === 'INTAKE')

  return (
    <>
      <h1>Intake</h1>
      <p className="lede">
        Answer a few questions so {ctx.agency.name} can start work on your order. File uploads aren&apos;t
        supported yet — paste links to any files instead.
      </p>

      {openOrders.length === 0 ? (
        <Card>
          <EmptyState
            title="Nothing needs intake"
            body="When an order is waiting for your answers, it will show up here."
          />
        </Card>
      ) : (
        <Card>
          <IntakeForm
            orders={openOrders.map((o) => ({
              id: o.id,
              label: `${o.service.name} — ${formatDate(o.createdAt)}`,
            }))}
          />
        </Card>
      )}
    </>
  )
}
