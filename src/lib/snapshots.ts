import type { HourlySample } from './types';
import { fetchHistory } from './api';

interface SnapshotPath {
  params: { date: string; time: string };
  props: { sample: HourlySample; allSamples: HourlySample[] };
}

/**
 * Parse an ISO hour field like "2026-07-24T20:00+09:00"
 * into date "2026-07-24" and time "20-00".
 * Returns null if the format is unexpected.
 */
export function parseHourField(
  hour: string,
): { date: string; time: string } | null {
  const match = hour.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;
  return {
    date: match[1],
    time: `${match[2]}-${match[3]}`,
  };
}

/**
 * Fetch all history and return getStaticPaths-compatible data.
 * Each hourly snapshot becomes a route at /YYYY-MM-DD/HH-mm/.
 *
 * Returns empty array on fetch failure (env not set, network error, etc.)
 * so the build can still succeed with zero historical pages.
 */
export async function getSnapshotPaths(): Promise<SnapshotPath[]> {
  try {
    const res = await fetchHistory();
    const samples = res.samples;

    // Deduplicate by hour field, keeping the last sample per hour.
    const hourlyMap = new Map<string, HourlySample>();
    for (const s of samples) {
      hourlyMap.set(s.hour, s);
    }

    const result: SnapshotPath[] = [];
    for (const [hour, sample] of hourlyMap) {
      const parsed = parseHourField(hour);
      if (!parsed) continue;

      // Include all samples up to and including this snapshot's epochMs.
      const allSamples = samples.filter(
        (s) => s.epochMs <= sample.epochMs,
      );

      result.push({
        params: { date: parsed.date, time: parsed.time },
        props: { sample, allSamples },
      });
    }

    return result;
  } catch {
    // eslint-disable-next-line no-console
    console.warn(
      'snapshots: Failed to fetch history for static paths. ' +
        'Returning empty array — no historical pages will be generated.',
    );
    return [];
  }
}
