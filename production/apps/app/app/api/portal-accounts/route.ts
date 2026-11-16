import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { generateAccessCode, hashSecret, tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, serverError, unauthorized } from '../../../lib/api'

/**
 * Create a client portal login.
 * Body: { contactId, email }. Generates a one-time access code, stores only
 * its hash, and returns the code once so the agency can send it to the client.
 */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const contactId = asString(body.contactId)
    const email = asString(body.email)
    if (!contactId || !email) return badRequest('Contact and email are required.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest('A valid email address is required.')
    }

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, ...tenantWhere(user.agencyId) },
    })
    if (!contact) return badRequest('Contact not found for this agency.')

    const existing = await prisma.portalAccount.findUnique({ where: { contactId } })
    if (existing) {
      return NextResponse.json(
        { error: 'This contact already has a portal login.' },
        { status: 409 },
      )
    }

    const accessCode = generateAccessCode()
    const account = await prisma.portalAccount.create({
      data: {
        agencyId: user.agencyId,
        contactId,
        email,
        accessCodeHash: hashSecret(accessCode),
      },
    })
    return NextResponse.json(
      { id: account.id, email: account.email, accessCode },
      { status: 201 },
    )
  } catch (err) {
    return serverError(err)
  }
}
