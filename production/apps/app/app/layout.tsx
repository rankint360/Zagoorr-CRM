import type { ReactNode } from 'react'
import Link from 'next/link'
import { Logo } from '@zagoorr/ui'
import './globals.css'

const NAV: { section: string; links: { href: string; label: string }[] }[] = [
  {
    section: 'Workspace',
    links: [
      { href: '/', label: 'Dashboard' },
      { href: '/contacts', label: 'Contacts' },
      { href: '/deals', label: 'Deals' },
      { href: '/orders', label: 'Orders' },
      { href: '/projects', label: 'Projects' },
      { href: '/tickets', label: 'Support tickets' },
    ],
  },
  {
    section: 'Business',
    links: [
      { href: '/billing', label: 'Billing' },
      { href: '/reports', label: 'Reports' },
      { href: '/portal', label: 'Client portal' },
      { href: '/settings', label: 'Settings' },
    ],
  },
]

export const metadata = {
  title: 'Zagoorr — Agency workspace',
  description: 'Combined CRM for productised service agencies: contacts, pipeline, delivery and support on one client record.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="sidebar">
            <Link href="/" className="brand">
              <Logo size={32} />
              <span>Zagoorr</span>
            </Link>
            <nav className="nav" aria-label="Workspace">
              {NAV.map((group) => (
                <div key={group.section}>
                  <div className="nav-label">{group.section}</div>
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} className="nav-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="sidebar-foot">
              <Link href="/login">Sign in</Link>
              {' · '}
              <span>app.zagoorr.com</span>
            </div>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  )
}
