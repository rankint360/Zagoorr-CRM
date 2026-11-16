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
    const contacts = await prisma.contact.findMany({
      where: tenantWhere(user.agencyId),
      include: { company: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ contacts })
  } catch (err) {
    return serverError(err)
  }
}

export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const firstName = asString(body.firstName)
    const lastName = asString(body.lastName)
    const email = asString(body.email)
    const phone = asString(body.phone)
    const notes = asString(body.notes)
    const companyId = asString(body.companyId)
    if (!firstName || !lastName || !email) {
      return badRequest('First name, last name and email are required.')
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest('A valid email address is required.')
    }
    if (companyId) {
      const company = await prisma.company.findFirst({
        where: { id: companyId, ...tenantWhere(user.agencyId) },
      })
      if (!company) return badRequest('Company not found for this agency.')
    }
    const contact = await prisma.contact.create({
      data: {
        agencyId: user.agencyId,
        companyId: companyId ?? null,
        firstName,
        lastName,
        email,
        phone: phone ?? null,
        notes: notes ?? null,
      },
    })
    return NextResponse.json({ contact }, { status: 201 })
  } catch (err) {
    return serverError(err)
  }
}
