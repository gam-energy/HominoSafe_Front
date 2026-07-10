import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function findDynamicPageFiles(dir, results = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      findDynamicPageFiles(path, results);
    } else if (name === 'page.tsx' && path.includes('[')) {
      results.push(path);
    }
  }
  return results;
}

const from = 'export const dynamicParams = false;';
const to = 'export const dynamicParams = true;';

for (const file of findDynamicPageFiles(join(root, 'app'))) {
  const content = readFileSync(file, 'utf8');
  if (!content.includes(from)) continue;
  writeFileSync(file, content.replace(from, to));
  console.log('web route config restored:', file.replace(`${root}/`, ''));
}
