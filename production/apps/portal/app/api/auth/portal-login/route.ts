import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import {
  SESSION_COOKIE,
  serializeSessionCookie,
  verifySecret,
  type Session,
} from '@zagoorr/auth'
import { getRequestAgency } from '../../../../lib/tenant'

/**
 * POST /api/auth/portal-login — email + access code.
 * Finds the PortalAccount for this agency, verifies the code against
 * accessCodeHash, and sets a CLIENT session cookie. The session user id
 * is the Contact id, so every later query can filter by contactId.
 * Wrong email/code and unknown agency all return the same generic 401
 * so an attacker can't probe which half was right.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown
    accessCode?: unknown
  } | null
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const accessCode = typeof body?.accessCode === 'string' ? body.accessCode.trim() : ''
  if (!email || !accessCode) {
    return NextResponse.json({ error: 'Email and access code are required.' }, { status: 400 })
  }

  const agency = await getRequestAgency()
  if (!agency) {
    return NextResponse.json({ error: 'Invalid email or access code.' }, { status: 401 })
  }

  const account = await prisma.portalAccount.findFirst({
    where: { agencyId: agency.id, email },
    include: { contact: true },
  })
  if (!account || !verifySecret(accessCode, account.accessCodeHash)) {
    return NextResponse.json({ error: 'Invalid email or access code.' }, { status: 401 })
  }

  const session: Session = {
    user: {
      id: account.contactId,
      email: account.email,
      name: `${account.contact.firstName} ${account.contact.lastName}`.trim(),
      role: 'CLIENT',
      agencyId: agency.id,
    },
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, serializeSessionCookie(session), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60,
  })
  return response
}
