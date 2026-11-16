import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Host routing for the Zagoorr apps.
//
// NOTE: real domain / wildcard routing is configured in Vercel — one Vercel
// project per app, each with its Root Directory set to that app's folder
// (see root README, Deployment). This middleware is only a safety net so a
// request that lands on the wrong app is sent to the right one instead of
// rendering the wrong workspace.
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.zagoorr.com'
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.zagoorr.com'

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const hostname = host.split(':')[0].toLowerCase()

  // Platform admin lives on admin.zagoorr.com, not in the agency workspace.
  if (hostname === 'admin.zagoorr.com') {
    return NextResponse.redirect(new URL(req.nextUrl.pathname + req.nextUrl.search, ADMIN_URL))
  }

  // Client portals live on portal.zagoorr.com / <agency>.portal.zagoorr.com.
  if (hostname === 'portal.zagoorr.com' || hostname.endsWith('.portal.zagoorr.com')) {
    return NextResponse.redirect(new URL(req.nextUrl.pathname + req.nextUrl.search, PORTAL_URL))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
