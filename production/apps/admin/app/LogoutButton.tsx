'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@zagoorr/ui'

export default function LogoutButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
      }}
      style={{ color: '#c7d0dc', padding: '6px 10px', minHeight: 36 }}
    >
      Sign out
    </Button>
  )
}
