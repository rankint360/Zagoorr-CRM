import { prisma } from '@zagoorr/db'
import type { PortalContext } from './tenant'

/**
 * Own-data queries for the portal. Every query filters by BOTH
 * agencyId (tenant) and contactId (the logged-in client), so a client
 * can never see another client's rows — even within the same agency.
 */

export function getOwnOrders(ctx: PortalContext) {
  return prisma.order.findMany({
    where: { agencyId: ctx.agency.id, contactId: ctx.user.id },
    include: {
      service: true,
      project: { include: { tasks: { orderBy: { createdAt: 'asc' } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export function getOwnInvoices(ctx: PortalContext) {
  return prisma.invoice.findMany({
    where: { agencyId: ctx.agency.id, contactId: ctx.user.id },
    include: { order: { include: { service: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export function getOwnTickets(ctx: PortalContext) {
  return prisma.ticket.findMany({
    where: { agencyId: ctx.agency.id, contactId: ctx.user.id },
    include: { order: { include: { service: true } } },
    orderBy: { createdAt: 'desc' },
  })
}
