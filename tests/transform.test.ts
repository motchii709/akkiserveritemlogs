import { describe, it, expect } from 'vitest';
import {
  parseRawJson,
  topEntries,
  sumByModule,
  sumValues,
  downsampleHourly,
} from '../src/lib/transform';
import type { HourlySample } from '../src/lib/types';

describe('parseRawJson', () => {
  it('returns key-value map from valid JSON string', () => {
    const input = '{"minecraft:oak_log":187367,"minecraft:wheat":97135}';
    const result = parseRawJson(input);
    expect(result).toEqual({
      'minecraft:oak_log': 187367,
      'minecraft:wheat': 97135,
    });
  });

  it('returns null for empty string', () => {
    expect(parseRawJson('')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseRawJson('not json')).toBeNull();
  });

  it('returns null for non-object JSON', () => {
    expect(parseRawJson('[1,2,3]')).toBeNull();
  });

  it('handles null input', () => {
    expect(parseRawJson(null as unknown as string)).toBeNull();
  });
});

describe('topEntries', () => {
  const items: Record<string, number> = {
    'minecraft:oak_log': 100,
    'minecraft:stone': 50,
    'minecraft:dirt': 200,
    'minecraft:cobblestone': 75,
  };

  it('returns top N items sorted by quantity descending', () => {
    const result = topEntries(items, 2);
    expect(result).toEqual([
      { item: 'minecraft:dirt', qty: 200 },
      { item: 'minecraft:oak_log', qty: 100 },
    ]);
  });

  it('returns all items if n >= item count', () => {
    const result = topEntries(items, 10);
    expect(result).toHaveLength(4);
  });

  it('returns empty array for empty object', () => {
    expect(topEntries({}, 5)).toEqual([]);
  });

  it('returns empty array for n=0', () => {
    expect(topEntries(items, 0)).toEqual([]);
  });
});

describe('sumByModule', () => {
  it('groups items by module prefix', () => {
    const items: Record<string, number> = {
      'minecraft:oak_log': 100,
      'minecraft:stone': 50,
      'create:gear': 30,
      'create:cog': 20,
      'tfmg:pipe': 10,
    };
    const result = sumByModule(items);
    expect(result).toEqual({
      minecraft: 150,
      create: 50,
      tfmg: 10,
    });
  });

  it('handles items without colon separator', () => {
    const items: Record<string, number> = {
      'unknown_item': 10,
    };
    const result = sumByModule(items);
    expect(result).toEqual({ unknown_item: 10 });
  });

  it('returns empty object for empty input', () => {
    expect(sumByModule({})).toEqual({});
  });
});

describe('sumValues', () => {
  it('returns total sum of all values', () => {
    const items: Record<string, number> = {
      'a': 100,
      'b': 200,
      'c': 50,
    };
    expect(sumValues(items)).toBe(350);
  });

  it('returns 0 for empty object', () => {
    expect(sumValues({})).toBe(0);
  });
});

describe('downsampleHourly', () => {
  const makeSample = (hour: string, ts: string): HourlySample => ({
    ts,
    hour,
    epochMs: 0,
    unique: 100,
    total: 5000,
    top: [{ item: 'minecraft:oak_log', qty: 100 }],
    modules: { minecraft: 5000 },
  });

  it('keeps one sample per hour (last seen)', () => {
    const samples: HourlySample[] = [
      makeSample('2026-07-24T20:00+09:00', '2026/07/24 20:00:01'),
      makeSample('2026-07-24T20:00+09:00', '2026/07/24 20:30:00'),
      makeSample('2026-07-24T21:00+09:00', '2026/07/24 21:00:01'),
    ];
    const result = downsampleHourly(samples);
    expect(result).toHaveLength(2);
    expect(result[0].ts).toBe('2026/07/24 20:30:00');
    expect(result[1].ts).toBe('2026/07/24 21:00:01');
  });

  it('returns empty array for empty input', () => {
    expect(downsampleHourly([])).toEqual([]);
  });

  it('returns single sample when all same hour', () => {
    const samples: HourlySample[] = [
      makeSample('2026-07-24T20:00+09:00', '2026/07/24 20:00:01'),
    ];
    const result = downsampleHourly(samples);
    expect(result).toHaveLength(1);
  });
});
