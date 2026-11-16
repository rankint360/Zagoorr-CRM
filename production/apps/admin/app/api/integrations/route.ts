import { NextResponse, type NextRequest } from 'next/server'
import { prisma, type IntegrationProvider } from '@zagoorr/db'
import { INTEGRATION_PROVIDER_KEYS } from '../../../lib/catalog'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

// Platform-level integrations (agencyId null). Toggling records platform
// state only — no provider OAuth credentials are stored in v1.
export async function GET() {
  try {
    await getPlatformSession()
    const rows = await prisma.integration.findMany({ where: { agencyId: null } })
    const byProvider: Record<string, boolean> = {}
    for (const row of rows) byProvider[row.provider] = row.connected
    const integrations = INTEGRATION_PROVIDER_KEYS.map((provider) => ({
      provider,
      connected: byProvider[provider] ?? false,
    }))
    return NextResponse.json({ integrations })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.provider !== 'string' || typeof body.connected !== 'boolean') {
      return NextResponse.json({ error: 'provider and connected are required.' }, { status: 400 })
    }
    const provider = body.provider as string
    const connected = body.connected as boolean
    if (!INTEGRATION_PROVIDER_KEYS.includes(provider)) {
      return NextResponse.json({ error: 'Unknown integration provider.' }, { status: 400 })
    }

    // findFirst + update/create (not upsert): the compound unique includes
    // nullable agencyId, which upsert cannot reliably address.
    const existing = await prisma.integration.findFirst({
      where: { agencyId: null, provider: provider as IntegrationProvider },
    })
    const integration = existing
      ? await prisma.integration.update({ where: { id: existing.id }, data: { connected } })
      : await prisma.integration.create({
          data: { agencyId: null, provider: provider as IntegrationProvider, connected, config: {} },
        })
    await writeAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: 'integration.toggle',
      entity: 'Integration',
      entityId: integration.id,
      detail: `${provider} ${connected ? 'connected' : 'disconnected'} (platform-wide).`,
    })
    return NextResponse.json({ integration })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
