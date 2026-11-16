import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

const KNOWN_KEYS = [
  'landing_domain',
  'app_domain',
  'admin_domain',
  'portal_domain',
  'public_signups',
  'maintenance_mode',
]

export async function GET() {
  try {
    await getPlatformSession()
    const rows = await prisma.platformSetting.findMany()
    const settings: Record<string, unknown> = {}
    for (const row of rows) settings[row.key] = row.value
    return NextResponse.json({ settings })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })

    const entries: [string, unknown][] = []
    if (body.settings && typeof body.settings === 'object') {
      for (const [key, value] of Object.entries(body.settings as Record<string, unknown>)) {
        entries.push([key, value])
      }
    } else if (typeof body.key === 'string') {
      entries.push([body.key, body.value])
    }
    if (entries.length === 0) {
      return NextResponse.json({ error: 'Provide settings or a key/value pair.' }, { status: 400 })
    }
    for (const [key, value] of entries) {
      if (!KNOWN_KEYS.includes(key)) {
        return NextResponse.json({ error: `Unknown setting: ${key}.` }, { status: 400 })
      }
      if (value === undefined) {
        return NextResponse.json({ error: `Setting ${key} has no value.` }, { status: 400 })
      }
    }

    for (const [key, value] of entries) {
      // JSON.parse(JSON.stringify(...)) yields `any`, which Prisma accepts as
      // a Json value, and guarantees only JSON-serialisable data is stored.
      const jsonValue = JSON.parse(JSON.stringify(value)) as unknown
      const existing = await prisma.platformSetting.findUnique({ where: { key } })
      if (existing) {
        await prisma.platformSetting.update({ where: { key }, data: { value: jsonValue as never } })
      } else {
        await prisma.platformSetting.create({ data: { key, value: jsonValue as never } })
      }
    }
    await writeAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: 'settings.update',
      entity: 'PlatformSetting',
      detail: `Updated platform settings: ${entries.map(([k]) => k).join(', ')}.`,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
