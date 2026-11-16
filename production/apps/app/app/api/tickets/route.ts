import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma, TicketPriority, TicketStatus } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, notFound, serverError, unauthorized } from '../../../lib/api'

const STATUS_VALUES = Object.values(TicketStatus) as string[]
const PRIORITY_VALUES = Object.values(TicketPriority) as string[]

export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const tickets = await prisma.ticket.findMany({
      where: tenantWhere(user.agencyId),
      include: { contact: true, order: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ tickets })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const contactId = asString(body.contactId)
    const orderId = asString(body.orderId)
    const subject = asString(body.subject)
    const ticketBody = asString(body.body)
    const priorityRaw = asString(body.priority) ?? 'NORMAL'
    if (!contactId || !subject) return badRequest('Contact and subject are required.')
    if (!PRIORITY_VALUES.includes(priorityRaw)) return badRequest('Invalid priority.')

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...tenantWhere(user.agencyId) },
    })
    if (!contact) return badRequest('Contact not found for this agency.')
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, ...tenantWhere(user.agencyId) },
      })
      if (!order) return badRequest('Order not found for this agency.')
    }

    const ticket = await prisma.ticket.create({
      data: {
        agencyId: user.agencyId,
        contactId,
        orderId: orderId ?? null,
        subject,
        body: ticketBody ?? null,
        status: 'OPEN',
        priority: priorityRaw as TicketPriority,
      },
    })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}

/** PATCH { id, status } — move a ticket through OPEN → … → CLOSED. */
export async function PATCH(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const id = asString(body.id)
    const statusRaw = asString(body.status)
    if (!id || !statusRaw || !STATUS_VALUES.includes(statusRaw)) {
      return badRequest('A valid ticket id and status are required.')
    }
    const ticket = await prisma.ticket.findFirst({
      where: { id, ...tenantWhere(user.agencyId) },
    })
    if (!ticket) return notFound('Ticket not found.')

    const updated = await prisma.ticket.update({
      where: { id },
      data: { status: statusRaw as TicketStatus },
    })
    return NextResponse.json({ ticket: updated })
  } catch (err) {
    return serverError(err)
  }
}
