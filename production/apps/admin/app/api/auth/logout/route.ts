import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@zagoorr/auth'

/** Sign out of the platform admin (clears the session cookie). */
export async function POST() {
  cookies().set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return NextResponse.json({ ok: true })
}
