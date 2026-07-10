// Helpers for making Next.js dynamic routes compatible with `output: 'export'`
// (the static-export mode used by the Capacitor Android build) without
// breaking the regular server-rendered web build.
//
// Each dynamic route page adds a single re-export line:
//
//   export {
//     emptyStaticParams as generateStaticParams,
//     mobileDynamicParams as dynamicParams,
// } from '@/lib/staticExportHelpers';
//
// Behaviour:
// - Web build (no BUILD_TARGET): `dynamicParams = true` (default) and
//   `generateStaticParams` returns `[]`, so the page is server-rendered on
//   demand for any ID — identical to before.
// - Mobile build (BUILD_TARGET=mobile): `dynamicParams = false` and
//   `generateStaticParams` returns `[]`, so no dynamic pages are prerendered
//   but the static export build succeeds. Navigation to a specific ID at
//   runtime is handled client-side via Next.js' router + `useParams`.

export const mobileDynamicParams = process.env.BUILD_TARGET !== "mobile";

export function emptyStaticParams(): never[] {
  return [];
}
