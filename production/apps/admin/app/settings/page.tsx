import { redirect } from 'next/navigation'
import { getPlatformSession } from '../../lib/admin'
import { prisma } from '@zagoorr/db'
import SettingsManager from './SettingsManager'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string | boolean> = {
  landing_domain: 'zagoorr.com',
  app_domain: 'app.zagoorr.com',
  admin_domain: 'admin.zagoorr.com',
  portal_domain: 'portal.zagoorr.com',
  public_signups: false,
  maintenance_mode: false,
}

export default async function SettingsPage() {
  try {
    await getPlatformSession()
  } catch {
    redirect('/login')
  }

  const rows = await prisma.platformSetting.findMany()
  const settings: Record<string, string | boolean> = { ...DEFAULTS }
  for (const row of rows) {
    const v = row.value as unknown
    if (typeof v === 'string' || typeof v === 'boolean') settings[row.key] = v
  }

  return <SettingsManager initial={settings} />
}
