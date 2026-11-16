// Pure formatting helpers — safe to import from client components too.

/** Amounts are stored in minor units (cents/pence). */
export function formatMoney(amountMinor: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amountMinor / 100)
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`
  }
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

export function agencyStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'TRIAL':
      return 'brand'
    case 'SUSPENDED':
      return 'warning'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function invoiceStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'PAID':
      return 'success'
    case 'SENT':
      return 'brand'
    case 'OVERDUE':
      return 'danger'
    default:
      return 'neutral'
  }
}

export function domainStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'VERIFIED':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'FAILED':
      return 'danger'
    default:
      return 'neutral'
  }
}
