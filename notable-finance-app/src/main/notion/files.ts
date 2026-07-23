// Notion file caching. Notion-hosted file URLs are temporary signed S3 links (they expire
// ~1h), so storing the URL breaks offline and after expiry. Instead we download the bytes
// once during pull and store a self-contained data: URI — which works offline forever and
// never expires. Used for account QR codes (see sync/pull.ts).

const MAX_BYTES = 3_000_000 // guard against oversized files bloating the DB

function inferImageType(url: string): string {
  const u = url.toLowerCase()
  if (u.includes('.jpg') || u.includes('.jpeg')) return 'image/jpeg'
  if (u.includes('.webp')) return 'image/webp'
  if (u.includes('.svg')) return 'image/svg+xml'
  if (u.includes('.gif')) return 'image/gif'
  return 'image/png'
}

/**
 * Download an image URL and return a `data:<type>;base64,<bytes>` URI, or null on any
 * failure (offline, 404, expired URL, non-image, too large). Best-effort: never throws,
 * so a pull is never broken by an unreachable file.
 */
export async function downloadImageAsDataUri(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<string | null> {
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0 || buf.length > MAX_BYTES) return null
    const headerType = (res.headers.get('content-type') ?? '').split(';')[0].trim()
    const type = headerType.startsWith('image/') ? headerType : inferImageType(url)
    return `data:${type};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

/** Whether a stored qr_code value is already a cached data URI (so we can skip re-downloading). */
export function isCachedDataUri(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('data:')
}
