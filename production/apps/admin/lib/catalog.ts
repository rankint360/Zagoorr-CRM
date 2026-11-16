// Backend integrations the platform tracks (IntegrationProvider in the Prisma
// schema). Platform-level rows have agencyId null; per-agency connections are
// managed in the agency app. Pure data — safe for client components.

export const INTEGRATION_PROVIDERS = [
  { provider: 'QUICKBOOKS', name: 'QuickBooks', description: 'Accounting sync for agency invoices and expenses.' },
  { provider: 'XERO', name: 'Xero', description: 'Accounting sync for agency invoices and expenses.' },
  { provider: 'GOOGLE_CALENDAR', name: 'Google Calendar', description: 'Two-way calendar sync for bookings and deadlines.' },
  { provider: 'OUTLOOK_CALENDAR', name: 'Outlook Calendar', description: 'Two-way calendar sync for bookings and deadlines.' },
  { provider: 'SLACK', name: 'Slack', description: 'Notifications for deals, orders, and support tickets.' },
  { provider: 'TEAMS', name: 'Microsoft Teams', description: 'Notifications for deals, orders, and support tickets.' },
  { provider: 'ZAPIER', name: 'Zapier', description: 'Automation bridge to 6,000+ apps.' },
  { provider: 'MAKE', name: 'Make', description: 'Visual automation scenarios for agency workflows.' },
] as const

export type IntegrationProviderKey = (typeof INTEGRATION_PROVIDERS)[number]['provider']

export const INTEGRATION_PROVIDER_KEYS: string[] = INTEGRATION_PROVIDERS.map((p) => p.provider)
