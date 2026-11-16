import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma } from '@zagoorr/db'
import PortalManager from './PortalManager'

export const dynamic = 'force-dynamic'

export default async function PortalsPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const agencies = await prisma.agency.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, portalDomain: true, portalDomainStatus: true },
  })

  return (
    <PortalManager
      agencies={agencies.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        portalDomain: a.portalDomain,
        portalDomainStatus: a.portalDomainStatus,
      }))}
    />
  )
}
