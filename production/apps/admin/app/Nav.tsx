'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/agencies', label: 'Agencies' },
  { href: '/users', label: 'Users' },
  { href: '/plans', label: 'Plans & Billing' },
  { href: '/portals', label: 'Portals & Domains' },
  { href: '/integrations', label: 'Integrations' },
  { href: '/flags', label: 'Feature Flags' },
  { href: '/audit', label: 'Audit Trail' },
  { href: '/settings', label: 'Platform Settings' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <nav>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? 'navlink active' : 'navlink'}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
