import type { CSSProperties, ReactNode } from 'react'
import Link from 'next/link'
import { Logo, colors } from '@zagoorr/ui'
import { getPortalSession, getRequestAgency } from '../lib/tenant'
import './globals.css'

export const metadata = {
  title: 'Client Portal — Zagoorr',
  description: 'Your orders, delivery progress, invoices and support — in one place.',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [agency, session] = await Promise.all([getRequestAgency(), Promise.resolve(getPortalSession())])
  const brand = agency?.brandColor || colors.brand
  const agencyName = agency?.name ?? 'Zagoorr'

  return (
    <html lang="en">
      <body style={{ '--brand': brand } as CSSProperties}>
        <header className="site-header">
          <Link href="/" className="brand">
            <Logo size={34} />
            <span className="brand-name">{agencyName} Portal</span>
          </Link>
          {session ? (
            <nav className="site-nav" aria-label="Portal">
              <Link href="/">Home</Link>
              <Link href="/orders">Orders</Link>
              <Link href="/invoices">Invoices</Link>
              <Link href="/tickets">Tickets</Link>
              <Link href="/intake">Intake</Link>
              <form action="/api/auth/logout" method="post" className="logout-form">
                <button type="submit" className="link-button">
                  Sign out
                </button>
              </form>
            </nav>
          ) : null}
        </header>
        <main className="page">{children}</main>
        <footer className="site-footer">
          <p>
            {agencyName} client portal · Powered by Zagoorr
            <br />
            Invoices are view-only — online payments are not enabled.
          </p>
        </footer>
      </body>
    </html>
  )
}
