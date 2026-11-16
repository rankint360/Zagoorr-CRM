import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, serverError, unauthorized } from '../../../lib/api'

const ENTITIES = ['contact', 'deal']
const FIELD_TYPES = ['text', 'number', 'date', 'select']

export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const customFields = await prisma.customField.findMany({
      where: tenantWhere(user.agencyId),
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ customFields })
  } catch (err) {
    return serverError(err)
  }
}

/** POST { entity ("contact"|"deal"), name, fieldType? } — define a custom field. */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const entity = asString(body.entity)
    const name = asString(body.name)
    const fieldType = asString(body.fieldType) ?? 'text'
    if (!entity || !ENTITIES.includes(entity)) return badRequest('Entity must be contact or deal.')
    if (!name) return badRequest('Field name is required.')
    if (!FIELD_TYPES.includes(fieldType)) return badRequest('Invalid field type.')

    const customField = await prisma.customField.create({
      data: { agencyId: user.agencyId, entity, name, fieldType },
    })
    return NextResponse.json({ customField }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
