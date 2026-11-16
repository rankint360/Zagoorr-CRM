import { NextResponse, type NextRequest } from 'next/server'

/**
 * Portal tenant resolution (middleware half).
 *
 * Reads the hostname and, when it is a `<agency>.portal.zagoorr.com`
 * subdomain, stores the agency slug in the `x-zagoorr-agency` request
 * header for server components and API routes to use. The header is
 * set on the forwarded request (via NextResponse.next({ request }))
 * — response headers alone would NOT reach server code.
 *
 * Custom CNAME domains (e.g. `portal.acmeagency.com`, stored as
 * Agency.portalDomain) are NOT resolved here: middleware runs on the
 * Edge runtime, which cannot use Prisma. The DB lookup lives in
 * `lib/tenant.ts` (`resolveAgencyFromHost`), which server code calls
 * with the host header. Middleware passes the host through untouched
 * for those requests, so the full resolution still happens per request.
 *
 * NOTE: real wildcard DNS (`*.portal.zagoorr.com`) + the matching
 * wildcard domain on the Vercel project are required for subdomain
 * portals to reach this app at all (see root README — Deployment).
 * Without them, only the apex/custom domains pointed at the project
 * will arrive here.
 */
export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()

  const portalSuffix = '.portal.zagoorr.com'
  if (host.endsWith(portalSuffix)) {
    const slug = host.slice(0, -portalSuffix.length).split('.')[0]
    // Guard against the bare apex (portal.zagoorr.com) and empty labels.
    if (slug && slug !== 'portal') {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-zagoorr-agency', slug)
      return NextResponse.next({ request: { headers: requestHeaders } })
    }
  }
  // Any other host (custom CNAME, localhost) is left alone:
  // lib/tenant.ts resolves it against Agency.portalDomain per request.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
