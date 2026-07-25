import type { ApiResponse, LatestResponse, ManifestResponse } from './types';

const DEFAULT_TIMEOUT_MS = 15_000;

function getEndpoint(): string {
  if (typeof window !== 'undefined' && (window as any).__GAS_ENDPOINT__) {
    return (window as any).__GAS_ENDPOINT__.replace(/\/+$/, '');
  }
  const endpoint = (import.meta.env.GAS_ENDPOINT || (import.meta.env as any).PUBLIC_GAS_ENDPOINT) as string | undefined;
  if (!endpoint) {
    throw new Error('GAS_ENDPOINT environment variable is not set');
  }
  return endpoint.replace(/\/+$/, '');
}

async function fetchJson<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const base = getEndpoint();
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, v);
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchHistory(since?: string): Promise<ApiResponse> {
  const params = since ? { since } : undefined;
  return fetchJson<ApiResponse>('/history', params);
}

export async function fetchLatest(): Promise<LatestResponse> {
  return fetchJson<LatestResponse>('/latest');
}

export async function fetchManifest(): Promise<ManifestResponse> {
  return fetchJson<ManifestResponse>('/manifest');
}
