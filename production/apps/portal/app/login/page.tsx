import { redirect } from 'next/navigation'
import { Card, EmptyState } from '@zagoorr/ui'
import { getPortalContext, getRequestAgency } from '../../lib/tenant'
import LoginForm from '../../components/LoginForm'

/** Standalone login page (same form as the logged-out home page). */
export default async function LoginPage() {
  const ctx = await getPortalContext()
  if (ctx) redirect('/')

  const agency = await getRequestAgency()
  if (!agency) {
    return (
      <Card>
        <EmptyState
          title="Portal not found"
          body="We couldn't find a client portal for this address. Check the link your agency sent you, or contact them directly."
        />
      </Card>
    )
  }

  return (
    <>
      <h1>Sign in</h1>
      <p className="lede">Sign in to your {agency.name} client portal.</p>
      <LoginForm agencyName={agency.name} />
    </>
  )
}
