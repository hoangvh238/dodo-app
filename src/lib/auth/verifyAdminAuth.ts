import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'

/**
 * Admin allowlist — only these emails can access /api/admin/* endpoints.
 * Set ADMIN_EMAILS env var as comma-separated list: "a@x.com,b@x.com"
 */
function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? ''
  return new Set(
    raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  )
}

/** Verify the Supabase dashboard session AND that the user is in the admin allowlist. */
export async function verifyAdminAuth(
  req: NextRequest,
): Promise<{ userId: string; email: string } | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setAll(_cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const email = user.email.toLowerCase()
  const admins = getAdminEmails()

  // Deny if ADMIN_EMAILS is not configured or email not in allowlist
  if (admins.size === 0 || !admins.has(email)) {
    console.warn(`[admin] access denied for: ${email}`)
    return null
  }

  return { userId: user.id, email: user.email }
}
