/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,

  // NOTE: The previous rewrite-based proxy for /api/v1/:path* was removed.
  // Next.js rewrites proxy through an internal http-proxy with a hardcoded
  // 30-second socket timeout (vercel/next.js#36586).  Because the backend
  // calls Notion which can take 60+ seconds, the proxy was replaced with a
  // custom route handler at src/app/api/v1/[...path]/route.ts that fetches
  // the backend directly with a 120-second timeout.
};

export default nextConfig;
