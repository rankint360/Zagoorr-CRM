import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

// Platform-wide feature flags (agencyId null).
export async function GET() {
  try {
    await getPlatformSession()
    const flags = await prisma.featureFlag.findMany({
      where: { agencyId: null },
      orderBy: { key: 'asc' },
    })
    return NextResponse.json({ flags })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    const key = typeof body.key === 'string' ? body.key.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!key || !name) return NextResponse.json({ error: 'key and name are required.' }, { status: 400 })
    if (!/^[a-z0-9_]+$/.test(key)) {
      return NextResponse.json({ error: 'Key may only contain lowercase letters, numbers and underscores.' }, { status: 400 })
    }
    const existing = await prisma.featureFlag.findFirst({ where: { agencyId: null, key } })
    if (existing) return NextResponse.json({ error: 'A flag with that key already exists.' }, { status: 409 })

    const flag = await prisma.featureFlag.create({
      data: {
        agencyId: null,
        key,
        name,
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        enabled: body.enabled === true,
      },
    })
    await writeAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: 'flag.create',
      entity: 'FeatureFlag',
      entityId: flag.id,
      detail: `Created feature flag ${flag.key} (${flag.name}).`,
    })
    return NextResponse.json({ flag }, { status: 201 })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 })
    }
    const data: { enabled?: boolean; name?: string; description?: string | null } = {}
    if (typeof body.enabled === 'boolean') data.enabled = body.enabled
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.description === 'string' || body.description === null) {
      data.description = (body.description as string) || null
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }
    const flag = await prisma.featureFlag.update({ where: { id: body.id as string }, data })
    await writeAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: 'flag.update',
      entity: 'FeatureFlag',
      entityId: flag.id,
      detail: `Updated flag ${flag.key}: ${Object.keys(data).join(', ')}.`,
    })
    return NextResponse.json({ flag })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
