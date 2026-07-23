import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createServer, type Server } from 'node:http'
import { downloadImageAsDataUri, isCachedDataUri } from '../src/main/notion/files'

// A 1x1 transparent PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

let server: Server
let base = ''

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/qr.png') {
      res.writeHead(200, { 'content-type': 'image/png' })
      res.end(PNG)
    } else if (req.url === '/notype') {
      res.writeHead(200) // no content-type → infer from URL
      res.end(PNG)
    } else if (req.url === '/huge') {
      res.writeHead(200, { 'content-type': 'image/png' })
      res.end(Buffer.alloc(4_000_000))
    } else {
      res.writeHead(404)
      res.end('nope')
    }
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const addr = server.address()
  base = typeof addr === 'object' && addr ? `http://127.0.0.1:${addr.port}` : ''
})

afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe('downloadImageAsDataUri', () => {
  it('downloads bytes and returns a base64 data URI with the served content-type', async () => {
    const uri = await downloadImageAsDataUri(`${base}/qr.png`)
    expect(uri).toBe(`data:image/png;base64,${PNG.toString('base64')}`)
  })

  it('infers the image type from the URL when the server sends none', async () => {
    const uri = await downloadImageAsDataUri(`${base}/notype`)
    expect(uri?.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('returns null on a 404 (offline-safe, never throws)', async () => {
    expect(await downloadImageAsDataUri(`${base}/missing`)).toBeNull()
  })

  it('returns null when the host is unreachable (offline)', async () => {
    expect(await downloadImageAsDataUri('http://127.0.0.1:1/qr.png')).toBeNull()
  })

  it('rejects files above the size cap', async () => {
    expect(await downloadImageAsDataUri(`${base}/huge`)).toBeNull()
  })
})

describe('isCachedDataUri', () => {
  it('recognises already-cached values so re-pulls skip re-downloading', () => {
    expect(isCachedDataUri('data:image/png;base64,AAAA')).toBe(true)
    expect(isCachedDataUri('https://prod-files-secure.s3.amazonaws.com/…')).toBe(false)
    expect(isCachedDataUri(null)).toBe(false)
  })
})
