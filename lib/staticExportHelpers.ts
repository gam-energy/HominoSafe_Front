// Route segment config for Capacitor static export (Next.js 16+).
//
// Next.js must statically parse `generateStaticParams` and `dynamicParams`
// in each route's server `page.tsx`. Values must be compile-time literals
// (no `process.env` expressions).
//
// Add this block at the top of every dynamic route's server page.tsx:
//
//   export function generateStaticParams() {
//     return [];
//   }
//
//   export const dynamicParams = true;
//
// For Capacitor static export (`npm run mobile:build`), a prebuild script
// temporarily flips `dynamicParams` to `false`, then restores it after build.
//
// Client-only routes: UI in `page-client.tsx`, thin server `page.tsx` above.

export {};
