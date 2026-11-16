import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma, IntegrationProvider } from '@zagoorr/db'
import { getSessionAgency } from '../../../lib/tenant'
import { asString, badRequest, serverError, unauthorized } from '../../../lib/api'

const PROVIDER_VALUES = Object.values(IntegrationProvider) as string[]

/**
 * POST /api/integrations { provider, connected } — record an integration as
 * connected / disconnected. OAuth for each provider is a later step; this
 * stores the connection state only.
 */
export async function POST(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const providerRaw = asString(body.provider)
    const connected = body.connected === true
    if (!providerRaw || !PROVIDER_VALUES.includes(providerRaw)) {
      return badRequest('A valid integration provider is required.')
    }
    const provider = providerRaw as IntegrationProvider

    const integration = await prisma.integration.upsert({
      where: { agencyId_provider: { agencyId: user.agencyId, provider } },
      update: { connected },
      create: { agencyId: user.agencyId, provider, connected },
    })
    return NextResponse.json({ integration })
  } catch (err) {
    return serverError(err)
  }
}
