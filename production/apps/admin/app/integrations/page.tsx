import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma } from '@zagoorr/db'
import { INTEGRATION_PROVIDERS } from '../../lib/catalog'
import IntegrationManager from './IntegrationManager'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  // Platform-level integrations have agencyId null.
  const rows = await prisma.integration.findMany({ where: { agencyId: null } })
  const connected = new Set(rows.filter((r) => r.connected).map((r) => r.provider))

  return (
    <IntegrationManager
      providers={INTEGRATION_PROVIDERS.map((p) => ({
        provider: p.provider,
        name: p.name,
        description: p.description,
        connected: connected.has(p.provider),
      }))}
    />
  )
}
