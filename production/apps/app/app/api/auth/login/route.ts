import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import {
  SESSION_COOKIE,
  serializeSessionCookie,
  verifySecret,
  type Session,
} from '@zagoorr/auth'
import { asString, serverError } from '../../../../lib/api'

const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days, in seconds

/**
 * Agency staff sign-in.
 * Validates email + password against User (ADMIN / TEAM only) and sets the
 * session cookie. When no database is configured the route returns a clear
 * 503 instead of a generic 500.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const email = asString(body.email)
    const password = typeof body.password === 'string' ? body.password : undefined
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email, role: { in: ['ADMIN', 'TEAM'] } },
    })
    if (!user || !user.agencyId || !verifySecret(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const session: Session = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
      },
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    }

    const res = NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email, role: user.role },
    })
    res.cookies.set(SESSION_COOKIE, serializeSessionCookie(session), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === 'production',
    })
    return res
  } catch (err) {
    const code = (err as { code?: string } | null)?.code
    if (typeof code === 'string' && code.startsWith('P10')) {
      return NextResponse.json(
        { error: 'No database is configured — set DATABASE_URL and run migrations, then try again.' },
        { status: 503 },
      )
    }
    return serverError(err)
  }
}
