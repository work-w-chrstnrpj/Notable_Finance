import { NextRequest, NextResponse } from "next/server";

/**
 * Custom API proxy that replaces the Next.js rewrite for `/api/v1/:path*`.
 *
 * Next.js rewrites proxy through an internal `http-proxy` instance with a
 * **hardcoded 30-second socket timeout** (see vercel/next.js#36586).  The
 * `experimental.proxyTimeout` option was proposed but never merged.
 *
 * This route handler fetches the backend directly with a 120-second timeout,
 * which is long enough for slow Notion API calls.
 */

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";
const TIMEOUT_MS = 120_000; // 120 seconds

// ── Proxy logic ──────────────────────────────────────────────────────

async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const targetPath = path.join("/");
  const targetUrl = `${BACKEND_BASE}/api/v1/${targetPath}`;
  const search = request.nextUrl.search;
  const url = search ? `${targetUrl}${search}` : targetUrl;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Forward request headers, stripping hop-by-hop headers.
    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower !== "host" && lower !== "connection") {
        headers.set(key, value);
      }
    }

    const init: RequestInit = {
      method: request.method,
      headers,
      signal: controller.signal,
    };

    // Buffer the body so we don't need to deal with streaming/duplex.
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const response = await fetch(url, init);

    // Forward response headers.
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TIMEOUT",
            message: `Backend request timed out after ${TIMEOUT_MS / 1000} seconds`,
          },
        },
        { status: 504 },
      );
    }

    console.error("[api-proxy] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "PROXY_ERROR",
          message: "Failed to proxy request to backend",
        },
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ── Route handlers (one per HTTP method) ─────────────────────────────

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { path } = await params;
  return proxyRequest(request, path);
}

export {
  handler as GET,
  handler as HEAD,
  handler as POST,
  handler as PATCH,
  handler as PUT,
  handler as DELETE,
};
