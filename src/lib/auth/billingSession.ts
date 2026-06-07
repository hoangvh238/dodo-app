/**
 * Short-lived billing sessions (10 min) using HMAC-SHA256.
 * Avoids putting the raw Google access token in browser URLs.
 * No DB required — self-contained signed token.
 */

const SESSION_TTL_MS = 10 * 60 * 1000  // 10 minutes

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.BILLING_SESSION_SECRET ?? 'dev-billing-secret-change-in-prod'
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf
  return Buffer.from(bytes).toString('base64url')
}

/** Create a short-lived signed billing session token. */
export async function createBillingSession(sub: string, email: string): Promise<string> {
  const payload    = JSON.stringify({ sub, email, exp: Date.now() + SESSION_TTL_MS })
  const payloadB64 = b64url(new TextEncoder().encode(payload))
  const key        = await getKey()
  const sig        = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  return `${payloadB64}.${b64url(sig)}`
}

/** Verify a billing session token and return {sub, email}. Returns null if invalid/expired. */
export async function verifyBillingSession(sid: string): Promise<{ sub: string; email: string } | null> {
  const dot = sid.lastIndexOf('.')
  if (dot < 0) return null
  const payloadB64 = sid.slice(0, dot)
  const sigB64     = sid.slice(dot + 1)

  try {
    const key      = await getKey()
    const sigBytes = Buffer.from(sigB64, 'base64url')
    const valid    = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payloadB64))
    if (!valid) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as {
      sub?: string; email?: string; exp?: number
    }
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) return null

    return { sub: payload.sub, email: payload.email ?? '' }
  } catch {
    return null
  }
}
