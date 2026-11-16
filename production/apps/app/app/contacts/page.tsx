import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { CreateContactForm } from '../components/forms'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: contacts, dbError } = await safeQuery(
    () =>
      prisma.contact.findMany({
        where: tenantWhere(agencyId),
        include: { company: true },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Contacts</h1>
        <p className="muted">Every client on one record — deals, orders, projects, tickets and activity.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so contacts cannot be listed right now.</div>
      ) : null}

      <Card>
        <h2>Add a contact</h2>
        <CreateContactForm />
      </Card>

      <Card>
        <h2>All contacts ({contacts.length})</h2>
        {contacts.length === 0 ? (
          <EmptyState title="No contacts yet" body="Add your first contact above — production starts fresh." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Added</th></tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/contacts/${c.id}`}>{c.firstName} {c.lastName}</Link></td>
                    <td>{c.email}</td>
                    <td>{c.phone ?? '—'}</td>
                    <td>{c.company?.name ?? '—'}</td>
                    <td>{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
