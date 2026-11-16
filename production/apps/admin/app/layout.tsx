import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { Logo } from '@zagoorr/ui'
import { parseSessionCookie, SESSION_COOKIE } from '@zagoorr/auth'
import { prisma } from '@zagoorr/db'
import Nav from './Nav'
import LogoutButton from './LogoutButton'
import './globals.css'

export const metadata = {
  title: 'Zagoorr Admin — Platform',
  description: 'Zagoorr platform administration for Zagoorr staff only.',
}

/** Maintenance-mode flag, read best-effort (DB may be unreachable on /login). */
async function maintenanceOn(): Promise<boolean> {
  try {
    const setting = await prisma.platformSetting.findUnique({ where: { key: 'maintenance_mode' } })
    const v = setting?.value as unknown
    if (v === true) return true
    if (typeof v === 'object' && v !== null && (v as { enabled?: unknown }).enabled === true) return true
    return false
  } catch {
    return false
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = parseSessionCookie(cookies().get(SESSION_COOKIE)?.value)
  const isAdmin = session?.user?.role === 'PLATFORM_ADMIN'
  const maintenance = isAdmin ? await maintenanceOn() : false

  return (
    <html lang="en">
      <body>
        {maintenance ? (
          <div className="maintenance-banner">
            Maintenance mode is ON — agencies and portals see the maintenance notice.
          </div>
        ) : null}
        {isAdmin ? (
          <div className="shell">
            <aside className="sidebar">
              <div className="sidebar-brand">
                <Logo size={36} />
                <span>
                  Zagoorr<small>Platform Admin</small>
                </span>
              </div>
              <Nav />
              <div className="sidebar-foot">
                <div>Signed in as {session?.user?.name ?? session?.user?.email}</div>
                <div>{session?.user?.email}</div>
                <div style={{ marginTop: 10 }}>
                  <LogoutButton />
                </div>
              </div>
            </aside>
            <main className="content">{children}</main>
          </div>
        ) : (
          <main className="auth-shell">{children}</main>
        )}
      </body>
    </html>
  )
}
