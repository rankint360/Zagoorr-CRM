/** Run a Prisma query and fall back gracefully when the DB is unreachable. */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<{ data: T; dbError: boolean }> {
  try {
    return { data: await fn(), dbError: false }
  } catch {
    return { data: fallback, dbError: true }
  }
}

/** True for Prisma connection errors (P10xx: unreachable DB, bad credentials, …). */
export function isDbUnavailable(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code
  return typeof code === 'string' && code.startsWith('P10')
}
