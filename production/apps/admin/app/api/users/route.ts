import { NextResponse, type NextRequest } from 'next/server'
import { prisma, type UserRole } from '@zagoorr/db'
import { hashSecret, ROLES } from '@zagoorr/auth'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

type Body = Record<string, unknown>

async function readBody(request: NextRequest): Promise<Body | null> {
  const body = (await request.json().catch(() => null)) as Body | null
  return body && typeof body === 'object' ? body : null
}

export async function GET() {
  try {
    await getPlatformSession()
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { agency: { select: { id: true, name: true } } },
    })
    return NextResponse.json({ users })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = await readBody(request)
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const role = typeof body.role === 'string' ? body.role : ''
    const agencyId = typeof body.agencyId === 'string' && body.agencyId ? body.agencyId : null

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'name, email, password and role are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (!(ROLES as string[]).includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    if (role === 'PLATFORM_ADMIN' && agencyId) {
      return NextResponse.json({ error: 'Platform admins do not belong to an agency.' }, { status: 400 })
    }
    if (agencyId) {
      const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
      if (!agency) return NextResponse.json({ error: 'Agency not found.' }, { status: 404 })
    }
    const existing = await prisma.user.findFirst({ where: { email, agencyId } })
    if (existing) {
      return NextResponse.json({ error: 'A user with that email already exists for this agency.' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: hashSecret(password), role: role as UserRole, agencyId },
    })
    await writeAudit({
      agencyId,
      actorId: admin.id,
      actorName: admin.name,
      action: 'user.create',
      entity: 'User',
      entityId: user.id,
      detail: `Created user ${user.name} (${user.email}) with role ${user.role}.`,
    })
    return NextResponse.json({ user: { ...user, passwordHash: undefined } }, { status: 201 })
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

    const data: { name?: string; team?: string | null; role?: UserRole } = {}
    if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
    if (typeof body.team === 'string' || body.team === null) data.team = (body.team as string) || null
    if (typeof body.role === 'string') {
      if (!(ROLES as string[]).includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
      }
      data.role = body.role as UserRole
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 })
    }

    const current = await prisma.user.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    // Keep at least one platform admin: never demote the last one.
    if (data.role && data.role !== 'PLATFORM_ADMIN' && current.role === 'PLATFORM_ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'PLATFORM_ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the last platform admin.' }, { status: 400 })
      }
    }

    const user = await prisma.user.update({ where: { id }, data })
    await writeAudit({
      agencyId: user.agencyId,
      actorId: admin.id,
      actorName: admin.name,
      action: 'user.update',
      entity: 'User',
      entityId: user.id,
      detail: `Updated user ${user.name} (${user.email}): ${Object.keys(data).join(', ')}.`,
    })
    return NextResponse.json({ user: { ...user, passwordHash: undefined } })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
