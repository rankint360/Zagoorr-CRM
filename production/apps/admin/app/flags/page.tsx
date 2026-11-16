import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma } from '@zagoorr/db'
import FlagManager from './FlagManager'

export const dynamic = 'force-dynamic'

export default async function FlagsPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  // Platform-wide flags have agencyId null.
  const flags = await prisma.featureFlag.findMany({
    where: { agencyId: null },
    orderBy: { key: 'asc' },
  })

  return (
    <FlagManager
      flags={flags.map((f) => ({
        id: f.id,
        key: f.key,
        name: f.name,
        enabled: f.enabled,
        description: f.description,
        createdAt: f.createdAt.toISOString(),
      }))}
    />
  )
}
