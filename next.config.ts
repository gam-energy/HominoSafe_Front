import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Mobile (Capacitor) builds use Next.js static export. Web builds keep the
// default server-rendered output. We gate everything on BUILD_TARGET=mobile
// so the existing web workflow is untouched.
const isMobileBuild = process.env.BUILD_TARGET === "mobile";

const withPWA = withPWAInit({
  dest: "public",
  // Service workers are unnecessary inside a Capacitor shell (assets are
  // bundled into the APK) and next-pwa has limited static-export support.
  disable: process.env.NODE_ENV === "development" || isMobileBuild,
  register: !isMobileBuild,
});

// Server-side upstream for same-origin API proxy (browser → :3000 → FastAPI).
// Must be reachable from the Next container (join homino_safe_homino_network).
const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "http://homino_app:8888"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // next-pwa injects webpack plugins; Next 16 defaults to Turbopack for dev.
  // An empty turbopack block acknowledges the webpack config coexistence.
  turbopack: {},
  // Static export is required for Capacitor (it loads a folder of files).
  output: isMobileBuild ? "export" : undefined,
  // Static export needs trailing slashes so the WebView can resolve directory
  // routes to their index.html.
  trailingSlash: isMobileBuild ? true : undefined,
  // Do not 308 /user/ → /user; FastAPI routes use trailing slashes and the
  // SPA sends Authorization which browsers/axios drop on cross-path redirects.
  skipTrailingSlashRedirect: !isMobileBuild,
  images: {
    // next/image optimization needs a server; disable it for static export.
    unoptimized: isMobileBuild,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Keep UI on :3000; proxy API so auth cookies are same-origin (middleware).
  async rewrites() {
    if (isMobileBuild) return [];
    const t = apiProxyTarget;
    return [
      { source: "/token", destination: `${t}/token` },
      { source: "/refresh-token", destination: `${t}/refresh-token` },
      { source: "/logout", destination: `${t}/logout` },
      { source: "/register", destination: `${t}/register` },
      { source: "/forgot-password", destination: `${t}/forgot-password` },
      { source: "/forgot-password/:path*", destination: `${t}/forgot-password/:path*` },
      { source: "/referrals", destination: `${t}/referrals` },
      { source: "/referrals/:path*", destination: `${t}/referrals/:path*` },
      { source: "/user/", destination: `${t}/user/` },
      { source: "/user", destination: `${t}/user/` },
      { source: "/user/:path*/", destination: `${t}/user/:path*/` },
      { source: "/user/:path*", destination: `${t}/user/:path*` },
      { source: "/admin/:path*", destination: `${t}/admin/:path*` },
      { source: "/alert/:path*", destination: `${t}/alert/:path*` },
      { source: "/me/:path*", destination: `${t}/me/:path*` },
      { source: "/orders", destination: `${t}/orders` },
      { source: "/orders/:path*", destination: `${t}/orders/:path*` },
      { source: "/appointments", destination: `${t}/appointments` },
      { source: "/appointments/:path*", destination: `${t}/appointments/:path*` },
      { source: "/ehr", destination: `${t}/ehr` },
      { source: "/ehr/:path*", destination: `${t}/ehr/:path*` },
      { source: "/medical/:path*", destination: `${t}/medical/:path*` },
      { source: "/device/:path*", destination: `${t}/device/:path*` },
      { source: "/doctor/:path*", destination: `${t}/doctor/:path*` },
      { source: "/causal/:path*", destination: `${t}/causal/:path*` },
      { source: "/synapse/:path*", destination: `${t}/synapse/:path*` },
      { source: "/support", destination: `${t}/support` },
      { source: "/support/:path*", destination: `${t}/support/:path*` },
      { source: "/api/:path*", destination: `${t}/api/:path*` },
      { source: "/health", destination: `${t}/health` },
      { source: "/health/:path*", destination: `${t}/health/:path*` },
      { source: "/ws/:path*", destination: `${t}/ws/:path*` },
    ];
  },
};

export default withPWA(nextConfig);
