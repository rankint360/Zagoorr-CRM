import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import {
  parseSessionCookie,
  requireRole,
  SESSION_COOKIE,
  type Session,
  type SessionUser,
} from '@zagoorr/auth'

/** Agency staff roles allowed in the agency workspace (app.zagoorr.com). */
const AGENCY_ROLES = ['ADMIN', 'TEAM'] as const

/** Read the session from an API-route request. Returns null when absent/expired. */
export function getSessionFromRequest(req: NextRequest): Session | null {
  return parseSessionCookie(req.cookies.get(SESSION_COOKIE)?.value)
}

/**
 * Resolve the agency user for an API route.
 * Returns null (caller responds 401) when there is no session, the role is
 * not agency staff, or the user has no agency.
 */
export function getSessionAgency(req: NextRequest): SessionUser | null {
  try {
    const session = getSessionFromRequest(req)
    const user = requireRole(session, [...AGENCY_ROLES])
    if (!user.agencyId) return null
    return user
  } catch {
    return null
  }
}

/** Read the session from cookies inside a server component. */
export async function getPageSession(): Promise<Session | null> {
  const store = await cookies()
  return parseSessionCookie(store.get(SESSION_COOKIE)?.value)
}

/**
 * Resolve the agency user for a server-component page.
 * Returns null when there is no session, the role is not agency staff, or
 * the user has no agency — pages redirect to /login in that case.
 */
export async function requirePageAgency(): Promise<SessionUser | null> {
  try {
    const session = await getPageSession()
    const user = requireRole(session, [...AGENCY_ROLES])
    if (!user.agencyId) return null
    return user
  } catch {
    return null
  }
}
