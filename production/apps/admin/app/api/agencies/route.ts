import { NextResponse, type NextRequest } from 'next/server'
import { prisma, type AgencyStatus } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

const STATUSES = ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'TRIAL']

type Body = Record<string, unknown>

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

async function readBody(request: NextRequest): Promise<Body | null> {
  const body = (await request.json().catch(() => null)) as Body | null
  return body && typeof body === 'object' ? body : null
}

export async function GET() {
  try {
    await getPlatformSession()
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { plan: true, _count: { select: { users: true } } },
    })
    return NextResponse.json({ agencies })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = await readBody(request)
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })

    const name = str(body.name).trim()
    const slug = str(body.slug).trim().toLowerCase()
    const email = str(body.email).trim()
    const status = str(body.status) || 'TRIAL'
    if (!name || !slug || !email) {
      return NextResponse.json({ error: 'name, slug and email are required.' }, { status: 400 })
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: 'Slug may only contain lowercase letters, numbers and hyphens.' }, { status: 400 })
    }
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    const existing = await prisma.agency.findFirst({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'That slug is already taken.' }, { status: 409 })

    const seats = typeof body.seats === 'number' ? body.seats : Number(body.seats)
    const taxRate = typeof body.taxRate === 'number' ? body.taxRate : Number(body.taxRate ?? 0)

    const agency = await prisma.agency.create({
      data: {
        name,
        slug,
        email,
        website: str(body.website).trim() || null,
        status: status as AgencyStatus,
        planId: str(body.planId) || null,
        seats: Number.isFinite(seats) && seats >= 1 ? Math.floor(seats) : 1,
        brandColor: str(body.brandColor) || '#FF6B4A',
        currency: (str(body.currency) || 'USD').toUpperCase(),
        taxRate: Number.isFinite(taxRate) ? taxRate : 0,
      },
    })
    await writeAudit({
      agencyId: agency.id,
      actorId: admin.id,
      actorName: admin.name,
      action: 'agency.create',
      entity: 'Agency',
      entityId: agency.id,
      detail: `Created agency ${agency.name} (${agency.slug}).`,
    })
    return NextResponse.json({ agency }, { status: 201 })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = await readBody(request)
    if (!body || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 })
    }
    const id = body.id as string

    const data: {
      name?: string
      email?: string
      website?: string | null
      status?: AgencyStatus
      planId?: string | null
      seats?: number
      brandColor?: string
      currency?: string
      taxRate?: number
    } = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.email === 'string' && body.email.trim()) data.email = body.email.trim()
    if (typeof body.website === 'string') data.website = body.website.trim() || null
    if (typeof body.status === 'string') {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
      }
      data.status = body.status as AgencyStatus
    }
    if (typeof body.planId === 'string' || body.planId === null) data.planId = (body.planId as string) || null
    if (body.seats !== undefined) {
      const seats = Number(body.seats)
      if (!Number.isFinite(seats) || seats < 1) {
        return NextResponse.json({ error: 'seats must be at least 1.' }, { status: 400 })
      }
      data.seats = Math.floor(seats)
    }
    if (typeof body.brandColor === 'string' && body.brandColor) data.brandColor = body.brandColor
    if (typeof body.currency === 'string' && body.currency.trim()) data.currency = body.currency.trim().toUpperCase()
    if (body.taxRate !== undefined) {
      const taxRate = Number(body.taxRate)
      if (!Number.isFinite(taxRate) || taxRate < 0) {
        return NextResponse.json({ error: 'taxRate must be 0 or more.' }, { status: 400 })
      }
      data.taxRate = taxRate
    }

    const agency = await prisma.agency.update({ where: { id }, data })
    await writeAudit({
      agencyId: agency.id,
      actorId: admin.id,
      actorName: admin.name,
      action: 'agency.update',
      entity: 'Agency',
      entityId: agency.id,
      detail: `Updated agency ${agency.name} (${Object.keys(data).join(', ')}).`,
    })
    return NextResponse.json({ agency })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = await readBody(request)
    if (!body || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'id is required.' }, { status: 400 })
    }
    const agency = await prisma.agency.findUnique({ where: { id: body.id as string } })
    if (!agency) return NextResponse.json({ error: 'Agency not found.' }, { status: 404 })
    await prisma.agency.delete({ where: { id: agency.id } })
    // Audit without agencyId: the agency (and anything referencing it) is gone.
    await writeAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: 'agency.delete',
      entity: 'Agency',
      entityId: agency.id,
      detail: `Deleted agency ${agency.name} (${agency.slug}).`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
