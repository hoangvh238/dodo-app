/**
 * Verifies a Google OAuth access token and returns user identity.
 * Results are cached for 5 minutes to avoid hammering Google's API.
 */

interface GoogleTokenInfo {
  sub: string        // google user ID (google_sub)
  email: string
  expires_in: number // seconds remaining
}

// Simple in-memory cache: token → { info, expiresAt }
const cache = new Map<string, { info: GoogleTokenInfo; expiresAt: number }>()

export async function verifyGoogleToken(accessToken: string): Promise<GoogleTokenInfo | null> {
  if (!accessToken) return null

  const cached = cache.get(accessToken)
  if (cached && cached.expiresAt > Date.now()) return cached.info

  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) {
      cache.delete(accessToken)
      return null
    }
    const data = await res.json() as {
      user_id?: string; sub?: string; email?: string; expires_in?: number; error?: string
    }
    if (data.error || (!data.user_id && !data.sub)) {
      cache.delete(accessToken)
      return null
    }

    const info: GoogleTokenInfo = {
      sub:        data.user_id ?? data.sub ?? '',
      email:      data.email ?? '',
      expires_in: data.expires_in ?? 3600,
    }

    // Cache for min(2min, token lifetime - 30s buffer) — shorter TTL so revoked tokens expire faster
    const cacheTtlMs = Math.min(2 * 60 * 1000, Math.max(0, (info.expires_in - 30) * 1000))
    cache.set(accessToken, { info, expiresAt: Date.now() + cacheTtlMs })

    // Evict stale entries every time we add a new one (simple GC)
    const now = Date.now()
    for (const [k, v] of cache) {
      if (v.expiresAt <= now) cache.delete(k)
    }

    return info
  } catch {
    return null
  }
}

/** Extract Bearer token from Authorization header */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim() || null
}
