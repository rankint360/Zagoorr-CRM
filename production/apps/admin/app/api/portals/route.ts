import { NextResponse, type NextRequest } from 'next/server'
import { prisma, DomainStatus } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

// Portals & domains. Default portal is <slug>.portal.zagoorr.com; a custom
// CNAME domain is stored on the agency and starts PENDING. "Verify" here
// records a manual check — automated DNS/CNAME verification is a follow-up.
export async function GET() {
  try {
    await getPlatformSession()
    const agencies = await prisma.agency.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, portalDomain: true, portalDomainStatus: true },
    })
    return NextResponse.json({ agencies })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.agencyId !== 'string') {
      return NextResponse.json({ error: 'agencyId is required.' }, { status: 400 })
    }
    const action = body.action as string
    if (action !== 'verify' && action !== 'fail') {
      return NextResponse.json({ error: "action must be 'verify' or 'fail'." }, { status: 400 })
    }
    const agency = await prisma.agency.findUnique({ where: { id: body.agencyId } })
    if (!agency) return NextResponse.json({ error: 'Agency not found.' }, { status: 404 })
    if (!agency.portalDomain) {
      return NextResponse.json({ error: 'No custom domain set for this agency.' }, { status: 400 })
    }
    const status: DomainStatus = action === 'verify' ? DomainStatus.VERIFIED : DomainStatus.FAILED
    const updated = await prisma.agency.update({
      where: { id: agency.id },
      data: { portalDomainStatus: status },
    })
    await writeAudit({
      agencyId: agency.id,
      actorId: admin.id,
      actorName: admin.name,
      action: 'portal.domain_verify',
      entity: 'Agency',
      entityId: agency.id,
      detail: `Custom domain ${agency.portalDomain} marked ${status} (manual check).`,
    })
    return NextResponse.json({ agency: updated })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.agencyId !== 'string') {
      return NextResponse.json({ error: 'agencyId is required.' }, { status: 400 })
    }
    const portalDomain =
      typeof body.portalDomain === 'string' && body.portalDomain.trim()
        ? body.portalDomain.trim().toLowerCase()
        : null
    if (portalDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(portalDomain)) {
      return NextResponse.json({ error: 'That does not look like a valid domain.' }, { status: 400 })
    }
    if (portalDomain) {
      const clash = await prisma.agency.findFirst({
        where: { portalDomain, NOT: { id: body.agencyId } },
      })
      if (clash) return NextResponse.json({ error: 'That domain is already used by another agency.' }, { status: 409 })
    }
    const agency = await prisma.agency.update({
      where: { id: body.agencyId },
      data: { portalDomain, portalDomainStatus: 'PENDING' },
    })
    await writeAudit({
      agencyId: agency.id,
      actorId: admin.id,
      actorName: admin.name,
      action: 'portal.domain_set',
      entity: 'Agency',
      entityId: agency.id,
      detail: portalDomain
        ? `Set custom portal domain ${portalDomain} (PENDING verification).`
        : `Removed custom portal domain for ${agency.name}.`,
    })
    return NextResponse.json({ agency })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
