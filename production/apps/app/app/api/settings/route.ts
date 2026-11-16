import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@zagoorr/db'
import { getSessionAgency } from '../../../lib/tenant'
import { asNumber, asString, badRequest, serverError, unauthorized } from '../../../lib/api'

const CURRENCIES = ['USD', 'GBP', 'EUR']

/**
 * PATCH /api/settings — white-label + billing defaults for the agency.
 * Body: { brandColor? ("#RRGGBB"), currency? ("USD"|"GBP"|"EUR"), taxRate? (0–100) }
 */
export async function PATCH(req: NextRequest) {
  const user = getSessionAgency(req)
  if (!user?.agencyId) return unauthorized()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const brandColor = asString(body.brandColor)
    const currency = asString(body.currency)
    const taxRate = asNumber(body.taxRate)

    const data: { brandColor?: string; currency?: string; taxRate?: number } = {}
    if (brandColor !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(brandColor)) return badRequest('Brand colour must be a hex colour like #FF6B4A.')
      data.brandColor = brandColor
    }
    if (currency !== undefined) {
      if (!CURRENCIES.includes(currency)) return badRequest('Currency must be USD, GBP or EUR.')
      data.currency = currency
    }
    if (taxRate !== undefined) {
      if (taxRate < 0 || taxRate > 100) return badRequest('Tax rate must be between 0 and 100.')
      data.taxRate = taxRate
    }
    if (Object.keys(data).length === 0) return badRequest('Nothing to update.')

    const agency = await prisma.agency.update({
      where: { id: user.agencyId },
      data,
    })
    return NextResponse.json({
      agency: { id: agency.id, brandColor: agency.brandColor, currency: agency.currency, taxRate: agency.taxRate },
    })
  } catch (err) {
    return serverError(err)
  }
}
