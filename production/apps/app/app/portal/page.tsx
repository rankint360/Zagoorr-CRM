import { redirect } from 'next/navigation'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Logo } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatDate } from '../../lib/format'
import { CreatePortalAccountForm } from '../components/forms'

export const dynamic = 'force-dynamic'

export default async function PortalPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: agency, dbError } = await safeQuery(
    () => prisma.agency.findUnique({ where: { id: agencyId } }),
    null,
  )
  const { data: accounts } = await safeQuery(
    () =>
      prisma.portalAccount.findMany({
        where: tenantWhere(agencyId),
        include: { contact: true },
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: contacts } = await safeQuery(
    () =>
      prisma.contact.findMany({
        where: tenantWhere(agencyId),
        orderBy: { firstName: 'asc' },
      }),
    [],
  )
  // Contacts without a portal login yet.
  const accountContactIds = new Set(accounts.map((a) => a.contactId))
  const withoutLogin = contacts.filter((c) => !accountContactIds.has(c.id))

  const portalHost = agency?.portalDomain ?? (agency ? `${agency.slug}.portal.zagoorr.com` : 'portal.zagoorr.com')
  const brandColor = agency?.brandColor ?? '#FF6B4A'

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Client portal</h1>
        <p className="muted">Give each client a login to their own portal — orders, invoices and tickets in one place.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so portal accounts cannot be listed right now.</div>
      ) : null}

      <div className="grid grid-2">
        <Card>
          <h2>Portal preview</h2>
          <div
            style={{
              border: `2px solid ${brandColor}`,
              borderRadius: 16,
              padding: 20,
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Logo size={32} />
              <strong style={{ fontSize: 18, color: '#0F1B2D' }}>{agency?.name ?? 'Your agency'}</strong>
            </div>
            <p className="muted">Welcome to your client portal.</p>
            <p className="small muted">
              Your orders, invoices and support tickets — branded{' '}
              <span style={{ color: brandColor, fontWeight: 700 }}>{brandColor}</span> for {agency?.name ?? 'your agency'}.
            </p>
            <p className="small muted">Portal address: <span className="mono">https://{portalHost}</span></p>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>
            White-label colour is set in Settings. Custom domains (CNAME) are configured by the platform — see the admin app.
          </p>
        </Card>

        <Card>
          <h2>Create a portal login</h2>
          {withoutLogin.length === 0 ? (
            <EmptyState
              title="No contacts without a login"
              body={contacts.length === 0 ? 'Add a contact first.' : 'Every contact already has a portal login.'}
            />
          ) : (
            <>
              <p className="muted small">An access code is generated and shown once — send it to the client yourself.</p>
              <CreatePortalAccountForm
                contacts={withoutLogin.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName} (${c.email})` }))}
              />
            </>
          )}
        </Card>
      </div>

      <Card>
        <h2>Portal logins ({accounts.length})</h2>
        {accounts.length === 0 ? (
          <EmptyState title="No portal logins yet" body="Create a login for a client and their access code is shown once, for you to send them." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Client</th><th>Portal email</th><th>Created</th></tr></thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.contact.firstName} {a.contact.lastName}</td>
                    <td>{a.email}</td>
                    <td>{formatDate(a.createdAt)}</td>
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
