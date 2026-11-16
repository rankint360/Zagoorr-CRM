import { cookies, headers } from 'next/headers'
import { prisma, type Agency } from '@zagoorr/db'
import { SESSION_COOKIE, parseSessionCookie, type SessionUser } from '@zagoorr/auth'

const PORTAL_SUFFIX = '.portal.zagoorr.com'

function stripPort(host: string): string {
  return host.split(':')[0].trim().toLowerCase()
}

/**
 * Resolve the agency that owns a portal hostname.
 *
 * 1. `<agency>.portal.zagoorr.com` → Agency.slug == first label.
 * 2. Otherwise → Agency.portalDomain == host (custom CNAME, e.g.
 *    `portal.acmeagency.com`).
 * 3. Otherwise → null (unknown portal — pages show a "portal not
 *    found" state instead of leaking another agency's data).
 *
 * Every DB call is guarded with try/catch so a missing/unreachable
 * database (e.g. during `next build`, when pages are prerendered
 * without a DB) resolves to null instead of crashing the build.
 *
 * Local dev affordance: with NODE_ENV !== 'production', setting
 * ZAGOORR_PORTAL_AGENCY_SLUG resolves that slug for localhost hosts,
 * where no subdomain exists. Never set this in production.
 */
export async function resolveAgencyFromHost(host: string | null | undefined): Promise<Agency | null> {
  if (!host) return null
  const clean = stripPort(host)
  if (!clean) return null

  try {
    if (clean.endsWith(PORTAL_SUFFIX)) {
      const slug = clean.slice(0, -PORTAL_SUFFIX.length).split('.')[0]
      if (!slug || slug === 'portal') return null
      return await prisma.agency.findFirst({ where: { slug } })
    }

    if (process.env.NODE_ENV !== 'production' && process.env.ZAGOORR_PORTAL_AGENCY_SLUG) {
      if (clean === 'localhost' || clean === '127.0.0.1' || clean.endsWith('.localhost')) {
        return await prisma.agency.findFirst({
          where: { slug: process.env.ZAGOORR_PORTAL_AGENCY_SLUG },
        })
      }
    }

    return await prisma.agency.findFirst({ where: { portalDomain: clean } })
  } catch {
    return null
  }
}

/**
 * Read the portal session cookie. Only role CLIENT is a portal user —
 * agency staff (ADMIN/TEAM) and platform admins must use their own
 * apps; a non-CLIENT session here is treated as logged out.
 */
export function getPortalSession(): SessionUser | null {
  const session = parseSessionCookie(cookies().get(SESSION_COOKIE)?.value)
  if (!session || session.user.role !== 'CLIENT') return null
  return session.user
}

/** Agency resolved from the current request (middleware header first, host fallback). */
export async function getRequestAgency(): Promise<Agency | null> {
  const hdrs = headers()
  const slug = hdrs.get('x-zagoorr-agency')
  if (slug) {
    try {
      const bySlug = await prisma.agency.findFirst({ where: { slug } })
      if (bySlug) return bySlug
    } catch {
      return null
    }
  }
  return resolveAgencyFromHost(hdrs.get('host'))
}

export type PortalContext = {
  agency: Agency
  user: SessionUser
}

/**
 * The guard every portal page and API route uses: resolve the agency
 * for this hostname, require a CLIENT session, and require the session
 * to belong to that agency. Returns null when any step fails — callers
 * render a login / not-found state or return 401, never data.
 */
export async function getPortalContext(): Promise<PortalContext | null> {
  const [agency, user] = await Promise.all([getRequestAgency(), Promise.resolve(getPortalSession())])
  if (!agency || !user) return null
  if (user.agencyId !== agency.id) return null
  return { agency, user }
}
