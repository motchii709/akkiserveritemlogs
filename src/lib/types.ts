export interface HourlySample {
  ts: string;
  hour: string;
  epochMs: number;
  unique: number;
  total: number;
  top: Array<{ item: string; qty: number }>;
  modules: Record<string, number>;
}

export interface ApiResponse {
  schema: number;
  generatedAt: string;
  granularity: string;
  since: string | null;
  count: number;
  samples: HourlySample[];
}

export interface LatestResponse {
  schema: number;
  generatedAt: string;
  latest: HourlySample | null;
}

export interface ManifestResponse {
  schema: number;
  sheet: { name: string; gid: number };
  generatedAt: string;
  sample: { granularity: string; strategy: string; topN: number };
  routes: string[];
}
