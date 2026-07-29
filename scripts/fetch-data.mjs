/**
 * Fetch data from GAS at build time and save as static JSON files.
 *
 * Usage:
 *   node scripts/fetch-data.mjs [--output public/data]
 *
 * Outputs:
 *   <output>/latest.json   — GAS /latest response (summary)
 *   <output>/history.json  — GAS /history response (downsampled history)
 *   <output>/items.json    — GAS /latest-items response (full item map)
 *
 * Requires GAS_ENDPOINT env var or --endpoint flag.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
let outputDir = 'public/data';
let endpoint = process.env.GAS_ENDPOINT || '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (args[i] === '--endpoint' && args[i + 1]) {
    endpoint = args[i + 1];
    i++;
  }
}

if (!endpoint) {
  console.error('ERROR: GAS_ENDPOINT env var or --endpoint flag is required');
  process.exit(1);
}

const base = endpoint.replace(/\/+$/, '');

async function fetchJson(route, params) {
  const url = new URL(base);
  url.searchParams.set('route', route);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`Fetching data from ${base}...`);
  await mkdir(outputDir, { recursive: true });

  const history = await fetchJson('history');
  const samples = history.samples || [];
  await writeFile(join(outputDir, 'history.json'), JSON.stringify(history));
  console.log(`  history.json written (${JSON.stringify(history).length} bytes, ${samples.length} samples)`);

  const latest = await fetchJson('latest');
  await writeFile(join(outputDir, 'latest.json'), JSON.stringify(latest));
  console.log(`  latest.json written (${JSON.stringify(latest).length} bytes)`);
  if (!latest.latest || latest.latest.total === 0) {
    console.warn('  WARNING: latest data is empty (total=0)');
  }

  const latestItems = await fetchJson('latest-items');
  await writeFile(join(outputDir, 'items.json'), JSON.stringify(latestItems));
  const totalItems = Object.keys(latestItems.items || {}).length;
  console.log(`  items.json written (${JSON.stringify(latestItems).length} bytes, ${totalItems} items)`);
  if (totalItems === 0) {
    console.warn('  WARNING: items data is empty');
  }

  console.log('Done!');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

