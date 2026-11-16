import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma } from '@zagoorr/db'
import UserManager from './UserManager'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const [users, agencies] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { agency: true },
    }),
    prisma.agency.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  return (
    <UserManager
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        team: u.team,
        agencyId: u.agencyId,
        agencyName: u.agency?.name ?? null,
        createdAt: u.createdAt.toISOString(),
      }))}
      agencies={agencies}
    />
  )
}
