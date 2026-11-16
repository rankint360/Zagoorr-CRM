import { NextResponse } from 'next/server'
import { prisma } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession } from '../../../lib/admin'

/** Plans are read-only here in v1 (seeded STARTER / GROWTH / SCALE). */
export async function GET() {
  try {
    await getPlatformSession()
    const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } })
    return NextResponse.json({ plans })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
