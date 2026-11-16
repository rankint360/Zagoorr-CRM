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
    const workflows = await prisma.workflow.findMany({
      where: tenantWhere(user.agencyId),
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ workflows })
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
    const trigger = asString(body.trigger)
    const action = asString(body.action)
    if (!name || !trigger || !action) {
      return badRequest('Name, trigger and action are required.')
    }
    const workflow = await prisma.workflow.create({
      data: {
        agencyId: user.agencyId,
        name,
        trigger,
        action,
        active: true,
      },
    })
    return NextResponse.json({ workflow }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
