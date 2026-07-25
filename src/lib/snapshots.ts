import type { HourlySample } from './types';
import { fetchHistory } from './api';

interface SnapshotPath {
  params: { date: string; time: string };
  props: { sample: HourlySample };
}

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

export async function getSnapshotPaths(): Promise<SnapshotPath[]> {
  try {
    const res = await fetchHistory();
    const samples = res.samples;

    const hourlyMap = new Map<string, HourlySample>();
    for (const s of samples) {
      hourlyMap.set(s.hour, s);
    }

    const result: SnapshotPath[] = [];
    for (const [, sample] of hourlyMap) {
      const parsed = parseHourField(sample.hour);
      if (!parsed) continue;
      result.push({
        params: { date: parsed.date, time: parsed.time },
        props: { sample },
      });
    }

    return result;
  } catch {
    console.warn(
      'snapshots: Failed to fetch history for static paths. ' +
        'Returning empty array — no historical pages will be generated.',
    );
    return [];
  }
}
