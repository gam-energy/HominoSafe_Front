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
};

export default withPWA(nextConfig);
