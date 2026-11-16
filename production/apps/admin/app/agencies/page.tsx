import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma } from '@zagoorr/db'
import AgencyManager from './AgencyManager'

export const dynamic = 'force-dynamic'

export default async function AgenciesPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const [agencies, plans] = await Promise.all([
    prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { plan: true, _count: { select: { users: true } } },
    }),
    prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } }),
  ])

  return (
    <AgencyManager
      agencies={agencies.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        website: a.website,
        email: a.email,
        status: a.status,
        planId: a.planId,
        planName: a.plan?.name ?? null,
        seats: a.seats,
        brandColor: a.brandColor,
        currency: a.currency,
        taxRate: a.taxRate,
        portalDomain: a.portalDomain,
        portalDomainStatus: a.portalDomainStatus,
        userCount: a._count.users,
        createdAt: a.createdAt.toISOString(),
      }))}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        priceMonthly: p.priceMonthly,
        currency: p.currency,
        seats: p.seats,
      }))}
    />
  )
}
