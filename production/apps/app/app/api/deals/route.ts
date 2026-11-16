import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma, DealStage } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { parseMajorToMinor } from '../../../lib/format'
import { asString, badRequest, notFound, serverError, unauthorized } from '../../../lib/api'

const STAGE_VALUES = Object.values(DealStage) as string[]

export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const deals = await prisma.deal.findMany({
      where: tenantWhere(user.agencyId),
      include: { contact: true, service: true },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ deals })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const title = asString(body.title)
    const contactId = asString(body.contactId)
    const serviceId = asString(body.serviceId)
    const currency = asString(body.currency) ?? 'USD'
    const value = parseMajorToMinor(body.value)
    if (!title || !contactId) return badRequest('Title and contact are required.')
    if (value === undefined) return badRequest('A valid deal value is required.')

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...tenantWhere(user.agencyId) },
    })
    if (!contact) return badRequest('Contact not found for this agency.')

    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: { id: serviceId, OR: [{ agencyId: user.agencyId }, { agencyId: null }] },
      })
      if (!service) return badRequest('Service not found.')
    }

    const deal = await prisma.deal.create({
      data: {
        agencyId: user.agencyId,
        contactId,
        serviceId: serviceId ?? null,
        title,
        value,
        currency,
        stage: 'LEAD',
      },
    })
    return NextResponse.json({ deal }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}

/**
 * PATCH { id, stage } — move a deal through the pipeline.
 * When a deal becomes WON, the deal-won workflow runs: an Order is created
 * (from the deal's service, or the agency's first active service) plus its
 * delivery Project, and matching active workflows have their run count bumped.
 */
export async function PATCH(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const id = asString(body.id)
    const stageRaw = asString(body.stage)
    if (!id || !stageRaw || !STAGE_VALUES.includes(stageRaw)) {
      return badRequest('A valid deal id and stage are required.')
    }
    const stage = stageRaw as DealStage

    const deal = await prisma.deal.findFirst({
      where: { id, ...tenantWhere(user.agencyId) },
    })
    if (!deal) return notFound('Deal not found.')

    const updated = await prisma.deal.update({ where: { id }, data: { stage } })

    let orderCreated = false
    if (stage === 'WON' && deal.stage !== 'WON') {
      const service = deal.serviceId
        ? await prisma.service.findFirst({
            where: { id: deal.serviceId, OR: [{ agencyId: user.agencyId }, { agencyId: null }] },
          })
        : await prisma.service.findFirst({
            where: { agencyId: user.agencyId, active: true },
            orderBy: { createdAt: 'asc' },
          })
      if (service) {
        const order = await prisma.order.create({
          data: {
            agencyId: user.agencyId,
            contactId: deal.contactId,
            dealId: deal.id,
            serviceId: service.id,
            status: 'DRAFT',
            amount: deal.value,
            currency: deal.currency,
          },
        })
        await prisma.project.create({
          data: {
            agencyId: user.agencyId,
            orderId: order.id,
            name: `${deal.title} — delivery`,
            status: 'NOT_STARTED',
          },
        })
        orderCreated = true
      }
      await prisma.workflow.updateMany({
        where: { agencyId: user.agencyId, trigger: 'deal_won', action: 'create_order', active: true },
        data: { runCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ deal: updated, orderCreated })
  } catch (err) {
    return serverError(err)
  }
}
