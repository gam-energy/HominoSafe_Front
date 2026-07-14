#!/usr/bin/env node
/**
 * Next.js 16 requires `dynamicParams` to be a compile-time boolean literal.
 * Web builds use `true` (on-demand dynamic routes). Mobile static export
 * needs `false` so the export succeeds with empty generateStaticParams.
 *
 * Usage: node scripts/patch-dynamic-params.mjs true|false
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const value = process.argv[2];
if (value !== 'true' && value !== 'false') {
  console.error('Usage: node scripts/patch-dynamic-params.mjs true|false');
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pattern = path.join(root, 'app/**/page.tsx');
const files = globSync(pattern).filter((file) =>
  readFileSync(file, 'utf8').includes('export const dynamicParams')
);

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const next = content.replace(
    /export const dynamicParams = (true|false);/,
    `export const dynamicParams = ${value};`
  );
  if (next !== content) {
    writeFileSync(file, next);
    console.log(`patched ${path.relative(root, file)} → ${value}`);
  }
}
