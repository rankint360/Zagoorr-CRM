import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { parseSessionCookie, requireRole, SESSION_COOKIE, type SessionUser } from '@zagoorr/auth'
import { prisma } from '@zagoorr/db'

// Server-only helpers for the platform admin app. Never import this file
// from a client component (it touches next/headers and Prisma).

/** Read the session cookie and require role PLATFORM_ADMIN. Throws Error('Unauthorized' | 'Forbidden'). */
export async function getPlatformSession(): Promise<SessionUser> {
  const session = parseSessionCookie(cookies().get(SESSION_COOKIE)?.value)
  return requireRole(session, ['PLATFORM_ADMIN'])
}

/**
 * Map an auth error thrown by getPlatformSession() to its HTTP response.
 * Returns null when the error is not an auth error (caller handles it).
 */
export function authErrorResponse(err: unknown): NextResponse | null {
  if (err instanceof Error && err.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (err instanceof Error && err.message === 'Forbidden') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

/** Best-effort audit write — an audit failure must never break the request it records. */
export async function writeAudit(input: {
  agencyId?: string | null
  actorId?: string | null
  actorName?: string | null
  action: string
  entity?: string
  entityId?: string
  detail?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        agencyId: input.agencyId ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        action: input.action,
        entity: input.entity ?? null,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
      },
    })
  } catch {
    // Audit is best-effort in v1; the calling handler already succeeded.
  }
}
