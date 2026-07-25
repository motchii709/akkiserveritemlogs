import type { HourlySample } from './types';

/**
 * Parse a raw_json string (e.g. '{"minecraft:oak_log":187367,...}')
 * into a Record<string, number>. Returns null on invalid/empty input.
 */
export function parseRawJson(text: string): Record<string, number> | null {
  if (!text || typeof text !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, number>;
  } catch {
    return null;
  }
}

/**
 * Return the top N entries from an object, sorted by value descending.
 */
export function topEntries(
  obj: Record<string, number>,
  n: number,
): Array<{ item: string; qty: number }> {
  return Object.entries(obj)
    .map(([item, qty]) => ({ item, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, n);
}

/**
 * Group items by module prefix (part before the first ':').
 * Items without ':' are grouped under their full name.
 */
export function sumByModule(obj: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, qty] of Object.entries(obj)) {
    const colonIdx = key.indexOf(':');
    const module = colonIdx >= 0 ? key.slice(0, colonIdx) : key;
    result[module] = (result[module] ?? 0) + qty;
  }
  return result;
}

/**
 * Sum all values in a Record<string, number>.
 */
export function sumValues(obj: Record<string, number>): number {
  return Object.values(obj).reduce((acc, v) => acc + v, 0);
}

/**
 * Keep only the last sample per hour (by `hour` field).
 * Assumes samples are in chronological order.
 */
export function downsampleHourly(samples: HourlySample[]): HourlySample[] {
  const map = new Map<string, HourlySample>();
  for (const s of samples) {
    map.set(s.hour, s);
  }
  return Array.from(map.values());
}
