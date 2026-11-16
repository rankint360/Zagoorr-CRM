import { NextResponse } from 'next/server'
import { prisma } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession } from '../../../lib/admin'

export async function GET() {
  try {
    await getPlatformSession()
    const entries = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agency: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ entries })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
