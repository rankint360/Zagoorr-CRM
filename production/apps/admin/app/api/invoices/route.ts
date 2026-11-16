import { NextResponse, type NextRequest } from 'next/server'
import { prisma, type InvoiceStatus } from '@zagoorr/db'
import { authErrorResponse, getPlatformSession, writeAudit } from '../../../lib/admin'

const STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID']

// Invoices are TRACKING ONLY (payments on hold): this records amounts and
// status. No payment provider is involved and no money moves.
export async function GET() {
  try {
    await getPlatformSession()
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { agency: { select: { id: true, name: true } }, contact: true },
    })
    return NextResponse.json({ invoices })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getPlatformSession()
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })

    const agencyId = typeof body.agencyId === 'string' ? body.agencyId : ''
    const contactId = typeof body.contactId === 'string' ? body.contactId : ''
    const amount = Number(body.amount)
    const status = typeof body.status === 'string' ? body.status : 'DRAFT'
    if (!agencyId || !contactId) {
      return NextResponse.json({ error: 'agencyId and contactId are required.' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount < 0 || !Number.isInteger(amount)) {
      return NextResponse.json({ error: 'amount must be a non-negative integer (minor units).' }, { status: 400 })
    }
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }
    const agency = await prisma.agency.findUnique({ where: { id: agencyId } })
    if (!agency) return NextResponse.json({ error: 'Agency not found.' }, { status: 404 })
    const contact = await prisma.contact.findFirst({ where: { id: contactId, agencyId } })
    if (!contact) return NextResponse.json({ error: 'Contact not found for this agency.' }, { status: 404 })

    const taxRate = Number(body.taxRate ?? 0)
    const currency = (typeof body.currency === 'string' && body.currency.trim() ? body.currency : 'USD').toUpperCase()
    let number = typeof body.number === 'string' && body.number.trim() ? body.number.trim() : ''
    if (!number) {
      const count = await prisma.invoice.count({ where: { agencyId } })
      number = `ZG-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    } else {
      const clash = await prisma.invoice.findFirst({ where: { agencyId, number } })
      if (clash) return NextResponse.json({ error: 'That invoice number already exists for this agency.' }, { status: 409 })
    }

    const invoice = await prisma.invoice.create({
      data: {
        agencyId,
        contactId,
        number,
        amount,
        currency,
        taxRate: Number.isFinite(taxRate) && taxRate >= 0 ? taxRate : 0,
        status: status as InvoiceStatus,
        dueDate:
          typeof body.dueDate === 'string' && body.dueDate ? new Date(body.dueDate) : null,
      },
    })
    await writeAudit({
      agencyId,
      actorId: admin.id,
      actorName: admin.name,
      action: 'invoice.create',
      entity: 'Invoice',
      entityId: invoice.id,
      detail: `Recorded invoice ${invoice.number} for ${agency.name} (${invoice.amount} ${invoice.currency}, ${invoice.status}). Tracking only.`,
    })
    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    return authErrorResponse(err) ?? NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
