import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma, OrderStatus } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { parseMajorToMinor } from '../../../lib/format'
import { asString, badRequest, notFound, serverError, unauthorized } from '../../../lib/api'

const STATUS_VALUES = Object.values(OrderStatus) as string[]

export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const orders = await prisma.order.findMany({
      where: tenantWhere(user.agencyId),
      include: { contact: true, service: true, deal: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders })
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
    const serviceId = asString(body.serviceId)
    const dealId = asString(body.dealId)
    const currency = asString(body.currency) ?? 'USD'
    const amount = parseMajorToMinor(body.amount)
    if (!contactId || !serviceId) return badRequest('Contact and service are required.')
    if (amount === undefined) return badRequest('A valid amount is required.')

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...tenantWhere(user.agencyId) },
    })
    if (!contact) return badRequest('Contact not found for this agency.')
    const service = await prisma.service.findFirst({
      where: { id: serviceId, OR: [{ agencyId: user.agencyId }, { agencyId: null }] },
    })
    if (!service) return badRequest('Service not found.')

    const order = await prisma.order.create({
      data: {
        agencyId: user.agencyId,
        contactId,
        serviceId,
        dealId: dealId ?? null,
        status: 'DRAFT',
        amount,
        currency,
      },
    })
    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}

/** PATCH { id, status } — used to cancel an order (status CANCELLED). */
export async function PATCH(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const id = asString(body.id)
    const statusRaw = asString(body.status)
    if (!id || !statusRaw || !STATUS_VALUES.includes(statusRaw)) {
      return badRequest('A valid order id and status are required.')
    }
    const status = statusRaw as OrderStatus

    const order = await prisma.order.findFirst({
      where: { id, ...tenantWhere(user.agencyId) },
    })
    if (!order) return notFound('Order not found.')
    if (order.status === 'DELIVERED' && status === 'CANCELLED') {
      return badRequest('A delivered order cannot be cancelled.')
    }

    const updated = await prisma.order.update({ where: { id }, data: { status } })
    return NextResponse.json({ order: updated })
  } catch (err) {
    return serverError(err)
  }
}
