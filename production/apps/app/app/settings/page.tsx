import { redirect } from 'next/navigation'
import { prisma } from '@zagoorr/db'
import { tenantWhere } from '@zagoorr/auth'
import { Card, EmptyState, Badge } from '@zagoorr/ui'
import { requirePageAgency } from '../../lib/tenant'
import { safeQuery } from '../../lib/db'
import { formatDate } from '../../lib/format'
import {
  BrandSettingsForm,
  CreateApiKeyForm,
  CreateWorkflowForm,
  CreateCustomFieldForm,
} from '../components/forms'
import { RevokeApiKeyButton, IntegrationToggle } from '../components/actions'

export const dynamic = 'force-dynamic'

const PROVIDERS = [
  { id: 'QUICKBOOKS', label: 'QuickBooks' },
  { id: 'XERO', label: 'Xero' },
  { id: 'GOOGLE_CALENDAR', label: 'Google Calendar' },
  { id: 'OUTLOOK_CALENDAR', label: 'Outlook Calendar' },
  { id: 'SLACK', label: 'Slack' },
  { id: 'TEAMS', label: 'Microsoft Teams' },
  { id: 'ZAPIER', label: 'Zapier' },
  { id: 'MAKE', label: 'Make' },
] as const

export default async function SettingsPage() {
  const user = await requirePageAgency()
  if (!user?.agencyId) redirect('/login')
  const agencyId = user.agencyId

  const { data: agency, dbError } = await safeQuery(
    () => prisma.agency.findUnique({ where: { id: agencyId } }),
    null,
  )
  const { data: apiKeys } = await safeQuery(
    () =>
      prisma.apiKey.findMany({
        where: tenantWhere(agencyId),
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: integrations } = await safeQuery(
    () => prisma.integration.findMany({ where: tenantWhere(agencyId) }),
    [],
  )
  const { data: workflows } = await safeQuery(
    () =>
      prisma.workflow.findMany({
        where: tenantWhere(agencyId),
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: customFields } = await safeQuery(
    () =>
      prisma.customField.findMany({
        where: tenantWhere(agencyId),
        orderBy: { createdAt: 'desc' },
      }),
    [],
  )
  const { data: team } = await safeQuery(
    () =>
      prisma.user.findMany({
        where: tenantWhere(agencyId),
        orderBy: { name: 'asc' },
      }),
    [],
  )

  const connected = new Map(integrations.map((i) => [i.provider, i.connected]))

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Settings</h1>
        <p className="muted">White-label, API keys, integrations, workflows, custom fields and your team.</p>
      </div>

      {dbError ? (
        <div className="notice" role="alert">The database is unreachable, so settings cannot be loaded right now.</div>
      ) : null}

      <Card>
        <h2>White-label &amp; billing defaults</h2>
        <p className="muted small">
          Agency: <strong>{agency?.name ?? '—'}</strong> · Portal: <span className="mono">{agency ? `${agency.slug}.portal.zagoorr.com` : '—'}</span>
        </p>
        <BrandSettingsForm
          brandColor={agency?.brandColor ?? '#FF6B4A'}
          currency={agency?.currency ?? 'USD'}
          taxRate={agency?.taxRate ?? 0}
        />
      </Card>

      <Card>
        <h2>API keys</h2>
        <p className="muted small">Keys are shown in full once, when created. Only the prefix is stored visibly; the full value is hashed.</p>
        <CreateApiKeyForm />
        <div style={{ marginTop: 16 }}>
          {apiKeys.length === 0 ? (
            <EmptyState title="No API keys yet" body="Create one above for an integration or your own tooling." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Name</th><th>Key</th><th>Created</th><th>Last used</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td>{k.name}</td>
                      <td><code className="mono">{k.keyPrefix}••••••••</code></td>
                      <td>{formatDate(k.createdAt)}</td>
                      <td>{formatDate(k.lastUsedAt)}</td>
                      <td>{k.revokedAt ? <Badge tone="danger">Revoked</Badge> : <Badge tone="success">Active</Badge>}</td>
                      <td>{k.revokedAt ? null : <RevokeApiKeyButton keyId={k.id} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2>Integrations</h2>
        <p className="muted small">Toggling an integration records the connection here. OAuth flows for each provider are a Phase 3 follow-up.</p>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Provider</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {PROVIDERS.map((p) => {
                const isConnected = connected.get(p.id) ?? false
                return (
                  <tr key={p.id}>
                    <td>{p.label}</td>
                    <td>{isConnected ? <Badge tone="success">Connected</Badge> : <Badge>Not connected</Badge>}</td>
                    <td><IntegrationToggle provider={p.id} connected={isConnected} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2>Workflows</h2>
        <p className="muted small">The built-in workflow — deal won → create order + project — always runs. Add your own below.</p>
        <CreateWorkflowForm />
        <div style={{ marginTop: 16 }}>
          {workflows.length === 0 ? (
            <EmptyState title="No custom workflows yet" body="Create one above. Triggers and actions run server-side when the event happens." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Name</th><th>Trigger</th><th>Action</th><th>Runs</th><th>Active</th></tr></thead>
                <tbody>
                  {workflows.map((w) => (
                    <tr key={w.id}>
                      <td>{w.name}</td>
                      <td>{w.trigger}</td>
                      <td>{w.action}</td>
                      <td>{w.runCount}</td>
                      <td>{w.active ? <Badge tone="success">Active</Badge> : <Badge>Paused</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2>Custom fields</h2>
        <CreateCustomFieldForm />
        <div style={{ marginTop: 16 }}>
          {customFields.length === 0 ? (
            <EmptyState title="No custom fields yet" body="Add extra fields to contacts or deals." />
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Field</th><th>Applies to</th><th>Type</th><th>Created</th></tr></thead>
                <tbody>
                  {customFields.map((f) => (
                    <tr key={f.id}>
                      <td>{f.name}</td>
                      <td>{f.entity}</td>
                      <td>{f.fieldType}</td>
                      <td>{formatDate(f.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2>Team directory</h2>
        {team.length === 0 ? (
          <EmptyState title="No team members found" body="Agency staff are added by the platform admin." />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th></tr></thead>
              <tbody>
                {team.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.email}</td>
                    <td><Badge tone={m.role === 'ADMIN' ? 'brand' : 'neutral'}>{m.role}</Badge></td>
                    <td>{m.team ?? '—'}</td>
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
