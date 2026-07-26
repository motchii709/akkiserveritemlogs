import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HourlySample, ApiResponse } from './types';

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

function readHistoryFromFile(): HourlySample[] {
  try {
    const raw = readFileSync(join(process.cwd(), 'public/data/history.json'), 'utf-8');
    const parsed = JSON.parse(raw) as ApiResponse;
    return parsed.samples || [];
  } catch {
    return [];
  }
}

export async function getSnapshotPaths(): Promise<SnapshotPath[]> {
  const samples = readHistoryFromFile();
  if (samples.length === 0) {
    console.warn(
      'snapshots: No history data found. ' +
        'Returning empty array — no historical pages will be generated.',
    );
    return [];
  }

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
}