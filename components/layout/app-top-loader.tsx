'use client';

import NextTopLoader from 'nextjs-toploader';

/** Client-only wrapper so NextTopLoader is not prerendered in the async root layout. */
export default function AppTopLoader() {
  return <NextTopLoader showSpinner={false} />;
}
