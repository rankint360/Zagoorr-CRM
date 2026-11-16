import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { parseMajorToMinor } from '../../../lib/format'
import { asNumber, asString, badRequest, serverError, unauthorized } from '../../../lib/api'

export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const invoices = await prisma.invoice.findMany({
      where: tenantWhere(user.agencyId),
      include: { contact: true, order: { include: { service: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ invoices })
  } catch (err) {
    return serverError(err)
  }
}

/**
 * Create an invoice (tracking only — no payment is processed).
 * Body: { contactId, orderId?, amount (major units, e.g. "500.00"),
 *         currency?, taxRate? (percent), dueDate? }
 */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const contactId = asString(body.contactId)
    const orderId = asString(body.orderId)
    const currency = asString(body.currency) ?? 'USD'
    const amount = parseMajorToMinor(body.amount)
    const taxRate = asNumber(body.taxRate) ?? 0
    const dueDateRaw = asString(body.dueDate)
    if (!contactId) return badRequest('Contact is required.')
    if (amount === undefined) return badRequest('A valid amount is required.')
    if (taxRate < 0 || taxRate > 100) return badRequest('Tax rate must be between 0 and 100.')

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

    let dueDate: Date | null = null
    if (dueDateRaw) {
      dueDate = new Date(dueDateRaw)
      if (Number.isNaN(dueDate.getTime())) return badRequest('Invalid due date.')
    }

    const count = await prisma.invoice.count({ where: tenantWhere(user.agencyId) })
    const number = `INV-${String(count + 1).padStart(4, '0')}`

    try {
      const invoice = await prisma.invoice.create({
        data: {
          agencyId: user.agencyId,
          contactId,
          orderId: orderId ?? null,
          number,
          amount,
          currency,
          taxRate,
          status: 'DRAFT',
          dueDate,
        },
      })
      return NextResponse.json({ invoice }, { status: 201 })
    } catch (createErr) {
      // Sequential number collided (e.g. a concurrent create) — retry once
      // with a unique suffix instead of failing the request.
      const code = (createErr as { code?: string } | null)?.code
      if (code !== 'P2002') throw createErr
      const invoice = await prisma.invoice.create({
        data: {
          agencyId: user.agencyId,
          contactId,
          orderId: orderId ?? null,
          number: `INV-${Date.now()}`,
          amount,
          currency,
          taxRate,
          status: 'DRAFT',
          dueDate,
        },
      })
      return NextResponse.json({ invoice }, { status: 201 })
    }
  } catch (err) {
    return serverError(err)
  }
}
