import { NextResponse } from 'next/server'
import { isDbUnavailable } from './db'

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function notFound(what = 'Not found') {
  return NextResponse.json({ error: what }, { status: 404 })
}

export function serverError(err: unknown) {
  if (isDbUnavailable(err)) {
    return NextResponse.json(
      { error: 'Database unavailable — check DATABASE_URL and run migrations.' },
      { status: 503 },
    )
  }
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}

/** Non-empty trimmed string, or undefined. */
export function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined
}

/** Finite number, or undefined. */
export function asNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) ? n : undefined
}
