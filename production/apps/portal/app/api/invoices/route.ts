import { NextResponse } from 'next/server'
import { getPortalContext } from '../../../lib/tenant'
import { getOwnInvoices } from '../../../lib/portal-data'

/**
 * GET /api/invoices — the logged-in client's own invoices.
 * View-only: payments are on hold, so this returns data for display
 * only and there is no checkout endpoint.
 */
export async function GET() {
  const ctx = await getPortalContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const invoices = await getOwnInvoices(ctx)
  return NextResponse.json({ invoices })
}
