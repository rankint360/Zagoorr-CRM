import { NextResponse } from 'next/server'
import { getPortalContext } from '../../../lib/tenant'
import { getOwnOrders } from '../../../lib/portal-data'

/** GET /api/orders — the logged-in client's own orders, with service and delivery project/tasks. */
export async function GET() {
  const ctx = await getPortalContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orders = await getOwnOrders(ctx)
  return NextResponse.json({ orders })
}
