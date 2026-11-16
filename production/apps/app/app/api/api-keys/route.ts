import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { generateApiKey, tenantWhere } from '@zagoorr/auth'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, notFound, serverError, unauthorized } from '../../../lib/api'

/** GET — masked list only. The full key is never stored or returned again. */
export async function GET(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const keys = await prisma.apiKey.findMany({
      where: tenantWhere(user.agencyId),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ apiKeys: keys })
  } catch (err) {
    return serverError(err)
  }
}

/** POST { name } — create a key. The full value is returned once, then never again. */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const name = asString(body.name)
    if (!name) return badRequest('Key name is required.')

    const { key, hash, prefix } = generateApiKey()
    const created = await prisma.apiKey.create({
      data: { agencyId: user.agencyId, name, keyHash: hash, keyPrefix: prefix },
    })
    return NextResponse.json(
      { id: created.id, name: created.name, key, keyPrefix: prefix },
      { status: 201 },
    )
  } catch (err) {
    return serverError(err)
  }
}

/** DELETE ?id=… — revoke a key (sets revokedAt; the row is kept for audit). */
export async function DELETE(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return badRequest('API key id is required.')
    const result = await prisma.apiKey.updateMany({
      where: { id, ...tenantWhere(user.agencyId), revokedAt: null },
      data: { revokedAt: new Date() },
    })
    if (result.count === 0) return notFound('API key not found or already revoked.')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return serverError(err)
  }
}
