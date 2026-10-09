/** @type {import('next').NextConfig} */
export function productionApiOrigin(value) {
  if (!value) throw new Error("Set NEXT_PUBLIC_API_URL to the production HTTPS backend URL ending in /api/v1 before building.");
  let url;
  try { url = new URL(value); } catch { throw new Error("NEXT_PUBLIC_API_URL must be an absolute HTTPS URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$)/i.test(url.hostname) || url.pathname !== "/api/v1") {
    throw new Error("NEXT_PUBLIC_API_URL must use HTTPS, a public hostname, and the exact /api/v1 path without credentials, query or fragment.");
  }
  return url.origin;
}

const production = process.env.NODE_ENV === "production";
const apiOrigin = production ? productionApiOrigin(process.env.NEXT_PUBLIC_API_URL) : new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").origin;
const csp = [
  "default-src 'self'",
  // Next static pages use inline hydration scripts; inline styles also support the existing animation system.
  `script-src 'self' 'unsafe-inline'${production ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:", "font-src 'self'",
  `connect-src 'self' ${apiOrigin}${production ? "" : " ws: wss:"}`,
  "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'",
  ...(production ? ["upgrade-insecure-requests"] : []),
].join("; ");
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : []),
    ] }];
  },
};
export default nextConfig;
