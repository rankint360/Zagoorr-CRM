import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@zagoorr/auth'

/**
 * POST /api/auth/logout — clears the portal session cookie and sends
 * the client back to the login page (same host, so custom domains and
 * subdomains both keep working).
 */
export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  const response = NextResponse.redirect(url)
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
