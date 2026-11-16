import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, serverError, unauthorized } from '../../../lib/api'

export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const projects = await prisma.project.findMany({
      where: tenantWhere(user.agencyId),
      include: {
        tasks: { orderBy: { createdAt: 'asc' } },
        order: { include: { service: true, contact: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ projects })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const name = asString(body.name)
    const orderId = asString(body.orderId)
    const dueDateRaw = asString(body.dueDate)
    if (!name) return badRequest('Project name is required.')

    let dueDate: Date | null = null
    if (dueDateRaw) {
      dueDate = new Date(dueDateRaw)
      if (Number.isNaN(dueDate.getTime())) return badRequest('Invalid due date.')
    }

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, ...tenantWhere(user.agencyId) },
      })
      if (!order) return badRequest('Order not found for this agency.')
      const existing = await prisma.project.findUnique({ where: { orderId } })
      if (existing) return badRequest('That order already has a project.')
    }

    const project = await prisma.project.create({
      data: {
        agencyId: user.agencyId,
        orderId: orderId ?? null,
        name,
        status: 'NOT_STARTED',
        dueDate,
      },
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
