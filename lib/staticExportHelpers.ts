// Route segment config for Capacitor static export (Next.js 16+).
//
// Next.js must statically parse `generateStaticParams` and `dynamicParams`
// in each route's server `page.tsx`. Values must be compile-time literals —
// env expressions like `process.env.BUILD_TARGET !== "mobile"` are rejected.
//
// Add this block at the top of every dynamic route's server page.tsx:
//
//   export function generateStaticParams() {
//     return [];
//   }
//
//   export const dynamicParams = true;
//
// Client-only routes: keep the UI in `page-client.tsx` and use a thin
// server `page.tsx` that exports the config above and renders PageClient.
//
// Mobile static export: `npm run mobile:build` temporarily patches
// `dynamicParams` to `false` via scripts/patch-dynamic-params.mjs.

export {};
