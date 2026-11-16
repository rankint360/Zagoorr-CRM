import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, serverError, unauthorized } from '../../../lib/api'

const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note']

/** POST { contactId, type, title, body? } — add to a contact's activity timeline. */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const contactId = asString(body.contactId)
    const type = asString(body.type) ?? 'note'
    const title = asString(body.title)
    const activityBody = asString(body.body)
    if (!contactId || !title) return badRequest('Contact and title are required.')
    if (!ACTIVITY_TYPES.includes(type)) return badRequest('Invalid activity type.')

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...tenantWhere(user.agencyId) },
    })
    if (!contact) return badRequest('Contact not found for this agency.')

    const activity = await prisma.activity.create({
      data: { contactId, type, title, body: activityBody ?? null },
    })
    return NextResponse.json({ activity }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
