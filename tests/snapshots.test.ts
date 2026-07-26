import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseHourField } from '../src/lib/snapshots';
import type { HourlySample, ApiResponse } from '../src/lib/types';
import * as fs from 'node:fs';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

import { getSnapshotPaths } from '../src/lib/snapshots';

describe('parseHourField', () => {
  it('parses standard ISO hour field with +09:00 offset', () => {
    expect(parseHourField('2026-07-24T20:00+09:00')).toEqual({
      date: '2026-07-24',
      time: '20-00',
    });
  });

  it('parses hour field with +00:00 offset', () => {
    expect(parseHourField('2026-01-01T00:00+00:00')).toEqual({
      date: '2026-01-01',
      time: '00-00',
    });
  });

  it('parses hour field with non-zero minutes', () => {
    expect(parseHourField('2026-07-24T15:30+09:00')).toEqual({
      date: '2026-07-24',
      time: '15-30',
    });
  });

  it('returns null for empty string', () => {
    expect(parseHourField('')).toBeNull();
  });

  it('returns null for invalid format', () => {
    expect(parseHourField('not-a-date')).toBeNull();
  });

  it('returns null for partial date without time', () => {
    expect(parseHourField('2026-07-24')).toBeNull();
  });
});

function makeSample(hour: string, ts: string, epochMs: number): HourlySample {
  return {
    ts,
    hour,
    epochMs,
    unique: 100,
    total: 5000,
    top: [{ item: 'minecraft:oak_log', qty: 100 }],
    modules: { minecraft: 5000 },
  };
}

const historyBody: ApiResponse = {
  schema: 1,
  generatedAt: '2026-07-24T21:00:00Z',
  granularity: 'hourly',
  since: null,
  count: 3,
  samples: [
    makeSample('2026-07-24T18:00+09:00', '2026/07/24 18:00:01', 1753363200000),
    makeSample('2026-07-24T19:00+09:00', '2026/07/24 19:00:01', 1753366800000),
    makeSample('2026-07-24T20:00+09:00', '2026/07/24 20:00:01', 1753370400000),
  ],
};

describe('getSnapshotPaths', () => {
  const mockReadFile = vi.mocked(fs.readFileSync);

  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it('returns paths for each hourly snapshot', async () => {
    mockReadFile.mockReturnValue(JSON.stringify(historyBody));
    const paths = await getSnapshotPaths();
    expect(paths).toHaveLength(3);
    expect(paths[0].params).toEqual({ date: '2026-07-24', time: '18-00' });
    expect(paths[1].params).toEqual({ date: '2026-07-24', time: '19-00' });
    expect(paths[2].params).toEqual({ date: '2026-07-24', time: '20-00' });
  });

  it('returns only sample in props (no allSamples)', async () => {
    mockReadFile.mockReturnValue(JSON.stringify(historyBody));
    const paths = await getSnapshotPaths();
    expect(paths[0].props).toHaveProperty('sample');
    expect(paths[0].props.sample.hour).toBe('2026-07-24T18:00+09:00');
    expect(paths[0].props).not.toHaveProperty('allSamples');
  });

  it('deduplicates by hour field', async () => {
    const body: ApiResponse = {
      ...historyBody,
      samples: [
        makeSample('2026-07-24T18:00+09:00', '2026/07/24 18:00:01', 1753363200000),
        makeSample('2026-07-24T18:00+09:00', '2026/07/24 18:30:00', 1753365000000),
      ],
    };
    mockReadFile.mockReturnValue(JSON.stringify(body));
    const paths = await getSnapshotPaths();
    expect(paths).toHaveLength(1);
    expect(paths[0].props.sample.ts).toBe('2026/07/24 18:30:00');
  });

  it('returns empty array on file read failure', async () => {
    mockReadFile.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const paths = await getSnapshotPaths();
    expect(paths).toEqual([]);
  });

  it('returns empty array when no samples', async () => {
    mockReadFile.mockReturnValue(
      JSON.stringify({ ...historyBody, samples: [], count: 0 }),
    );
    const paths = await getSnapshotPaths();
    expect(paths).toEqual([]);
  });
});
