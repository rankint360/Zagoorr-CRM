import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma, type Contact } from '@zagoorr/db'
import PlansManager from './PlansManager'

export const dynamic = 'force-dynamic'

export default async function PlansPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const [plans, invoices, agencies] = await Promise.all([
    prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } }),
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agency: true, contact: true },
    }),
    prisma.agency.findMany({
      orderBy: { name: 'asc' },
      include: { contacts: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
  ])

  return (
    <PlansManager
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        priceMonthly: p.priceMonthly,
        currency: p.currency,
        seats: p.seats,
        features: Array.isArray(p.features) ? (p.features as unknown[]) : [],
      }))}
      invoices={invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        agencyName: inv.agency.name,
        contactName: `${inv.contact.firstName} ${inv.contact.lastName}`,
        amount: inv.amount,
        currency: inv.currency,
        taxRate: inv.taxRate,
        status: inv.status,
        dueDate: inv.dueDate?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      }))}
      agencies={agencies.map((a) => ({
        id: a.id,
        name: a.name,
        contacts: a.contacts.map((c: Contact) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          email: c.email,
        })),
      }))}
    />
  )
}
