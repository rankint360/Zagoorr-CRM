import { NextResponse, type NextRequest } from 'next/server'

// Platform admin gate: every route except /login (and the login API) needs a
// session whose user role is PLATFORM_ADMIN. Everyone else is sent to /login.
//
// NOTE: this deliberately does NOT import @zagoorr/auth. That package imports
// node:crypto, which is not available in the Edge runtime middleware runs in.
// The check below re-implements the same shape parseSessionCookie performs
// (base64url JSON session, role + expiry check) with only Web APIs.
// Real SSO / signed sessions / rate limiting are a follow-up (hardening).

type SessionShape = {
  user?: { id?: string; role?: string }
  expiresAt?: number
}

function parseSession(value: string | undefined): SessionShape | null {
  if (!value) return null
  try {
    const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const session = JSON.parse(new TextDecoder().decode(bytes)) as SessionShape
    if (!session?.user?.id || !session?.user?.role) return null
    if (typeof session.expiresAt !== 'number' || session.expiresAt < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = parseSession(request.cookies.get('zagoorr_session')?.value)
  const isAdmin = session?.user?.role === 'PLATFORM_ADMIN'

  if (pathname === '/login') {
    // Already signed in as platform admin — skip the login form.
    if (isAdmin) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  if (!isAdmin) {
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth/login).*)'],
}
