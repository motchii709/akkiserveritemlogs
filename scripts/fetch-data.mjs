/**
 * Fetch data from GAS at build time and save as static JSON files.
 *
 * Usage:
 *   node scripts/fetch-data.mjs [--output dist/data]
 *
 * Outputs:
 *   <output>/latest.json   — GAS /latest response
 *   <output>/history.json  — GAS /history response
 *
 * Requires GAS_ENDPOINT env var or --endpoint flag.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
let outputDir = 'dist/data';
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
  const url = new URL(`${base}/${route}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
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

  const latest = await fetchJson('latest');
  await writeFile(join(outputDir, 'latest.json'), JSON.stringify(latest));
  console.log(`  latest.json written (${JSON.stringify(latest).length} bytes)`);

  const history = await fetchJson('history');
  await writeFile(join(outputDir, 'history.json'), JSON.stringify(history));
  console.log(`  history.json written (${JSON.stringify(history).length} bytes, ${history.samples?.length || 0} samples)`);

  console.log('Done!');
}

main().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
