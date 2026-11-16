import { NextResponse, type NextRequest } from 'next/server'
import { prisma, type Prisma } from '@zagoorr/db'
import { getPortalContext } from '../../../lib/tenant'

/**
 * POST /api/intake — save intake answers for one of the client's own
 * orders. The payload is merged into the order's existing intakeData
 * (JSON) so re-submitting only overwrites the fields sent. The order
 * must belong to the logged-in contact + resolved agency, and must be
 * in DRAFT or INTAKE — delivered/in-progress orders can't take intake.
 */
export async function POST(request: NextRequest) {
  const ctx = await getPortalContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as {
    orderId?: unknown
    intakeData?: unknown
  } | null
  if (typeof body?.orderId !== 'string' || !body.orderId) {
    return NextResponse.json({ error: 'orderId is required.' }, { status: 400 })
  }
  if (!body.intakeData || typeof body.intakeData !== 'object' || Array.isArray(body.intakeData)) {
    return NextResponse.json({ error: 'intakeData must be an object.' }, { status: 400 })
  }

  const order = await prisma.order.findFirst({
    where: { id: body.orderId, agencyId: ctx.agency.id, contactId: ctx.user.id },
  })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.status !== 'DRAFT' && order.status !== 'INTAKE') {
    return NextResponse.json(
      { error: 'This order is no longer accepting intake.' },
      { status: 409 },
    )
  }

  const existing =
    order.intakeData && typeof order.intakeData === 'object' && !Array.isArray(order.intakeData)
      ? (order.intakeData as Prisma.JsonObject)
      : {}

  const merged = {
    ...existing,
    ...(body.intakeData as Prisma.JsonObject),
  } as Prisma.InputJsonValue

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { intakeData: merged },
  })
  return NextResponse.json({ order: updated })
}
