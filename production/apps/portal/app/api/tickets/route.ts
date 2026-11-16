import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { getPortalContext } from '../../../lib/tenant'
import { getOwnTickets } from '../../../lib/portal-data'

/** GET /api/tickets — the logged-in client's own tickets. */
export async function GET() {
  const ctx = await getPortalContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tickets = await getOwnTickets(ctx)
  return NextResponse.json({ tickets })
}

/**
 * POST /api/tickets — raise a ticket. The ticket is always created
 * under the logged-in contact + resolved agency; an orderId may only
 * reference one of the client's own orders (anything else is ignored).
 */
export async function POST(request: NextRequest) {
  const ctx = await getPortalContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as {
    subject?: unknown
    body?: unknown
    orderId?: unknown
  } | null
  const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
  const ticketBody = typeof body?.body === 'string' ? body.body.trim() : ''
  if (!subject || !ticketBody) {
    return NextResponse.json({ error: 'Subject and message are required.' }, { status: 400 })
  }

  let orderId: string | null = null
  if (typeof body?.orderId === 'string' && body.orderId) {
    const ownOrder = await prisma.order.findFirst({
      where: { id: body.orderId, agencyId: ctx.agency.id, contactId: ctx.user.id },
      select: { id: true },
    })
    if (ownOrder) orderId = ownOrder.id
  }

  const ticket = await prisma.ticket.create({
    data: {
      agencyId: ctx.agency.id,
      contactId: ctx.user.id,
      orderId,
      subject,
      body: ticketBody,
    },
  })
  return NextResponse.json({ ticket }, { status: 201 })
}
