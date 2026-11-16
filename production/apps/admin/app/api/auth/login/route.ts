import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { serializeSessionCookie, SESSION_COOKIE, verifySecret } from '@zagoorr/auth'
import { writeAudit } from '../../../../lib/admin'

// Platform-admin sign-in. Only User rows with role PLATFORM_ADMIN can sign
// in here; agency staff and clients are rejected. Session is a 12-hour
// cookie (see @zagoorr/auth). Real SSO / signed sessions / rate limiting
// and login-attempt lockout are follow-ups (hardening).
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const email = typeof body?.email === 'string' ? body.email.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({ where: { email, role: 'PLATFORM_ADMIN' } })
    if (!user || !verifySecret(password, user.passwordHash)) {
      // Same message either way — do not reveal whether the email exists.
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
      },
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    }
    cookies().set(SESSION_COOKIE, serializeSessionCookie(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60,
    })
    await writeAudit({
      actorId: user.id,
      actorName: user.name,
      action: 'auth.login',
      entity: 'User',
      entityId: user.id,
      detail: `Platform admin ${user.email} signed in.`,
    })
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
