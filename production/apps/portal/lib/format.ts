/** Money is stored in minor units (cents/pence) — format for display. */
export function formatMoney(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amountMinor / 100)
  } catch {
    return `${currency || ''} ${(amountMinor / 100).toFixed(2)}`
  }
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Delivery progress from a project's tasks: { done, total, pct }. */
export function taskProgress(tasks: { status: string }[]): { done: number; total: number; pct: number } {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'DONE').length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}
