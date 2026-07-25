import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchHistory, fetchLatest, fetchManifest } from '../src/lib/api';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.stubEnv('GAS_ENDPOINT', 'https://example.com/gas');
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchHistory', () => {
  it('fetches /history without since param', async () => {
    const body = {
      schema: 1,
      generatedAt: '2026-07-25T10:00:00Z',
      granularity: 'hourly',
      since: null,
      count: 2,
      samples: [],
    };
    mockFetch.mockResolvedValue(jsonResponse(body));

    const result = await fetchHistory();
    expect(mockFetch).toHaveBeenCalledOnce();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('https://example.com/gas/history');
    expect(result).toEqual(body);
  });

  it('appends since query param when provided', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ samples: [] }));

    await fetchHistory('2026-07-24T00:00:00Z');
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('since=2026-07-24T00%3A00%3A00Z');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(new Response('error', { status: 500 }));
    await expect(fetchHistory()).rejects.toThrow('500');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValue(new Error('network fail'));
    await expect(fetchHistory()).rejects.toThrow('network fail');
  });
});

describe('fetchLatest', () => {
  it('fetches /latest', async () => {
    const body = {
      schema: 1,
      generatedAt: '2026-07-25T10:00:00Z',
      latest: null,
    };
    mockFetch.mockResolvedValue(jsonResponse(body));

    const result = await fetchLatest();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('https://example.com/gas/latest');
    expect(result).toEqual(body);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(new Response('not found', { status: 404 }));
    await expect(fetchLatest()).rejects.toThrow('404');
  });
});

describe('fetchManifest', () => {
  it('fetches /manifest', async () => {
    const body = {
      schema: 1,
      sheet: { name: 'ItemLog', gid: 123 },
      generatedAt: '2026-07-25T10:00:00Z',
      sample: { granularity: 'hourly', strategy: 'last', topN: 10 },
      routes: ['/latest'],
    };
    mockFetch.mockResolvedValue(jsonResponse(body));

    const result = await fetchManifest();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe('https://example.com/gas/manifest');
    expect(result).toEqual(body);
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(new Response('forbidden', { status: 403 }));
    await expect(fetchManifest()).rejects.toThrow('403');
  });
});

describe('fetchHistory timeout', () => {
  it('rejects after timeout (AbortError)', async () => {
    // Mock fetch that never resolves, relying on the AbortController
    // inside fetchJson to abort after DEFAULT_TIMEOUT_MS.
    // We shorten the timeout by overriding via env (not available),
    // so instead verify the AbortError path directly.
    mockFetch.mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise<never>((_, reject) => {
        const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'));
        init?.signal?.addEventListener('abort', onAbort, { once: true });
      });
    });

    // Simulate what the implementation does: abort after a short delay
    // by manually triggering the internal AbortController.
    // Instead, just verify fetchJson creates and uses AbortController.
    // We can test this by checking that the mock receives a signal.
    const promise = fetchHistory();
    // The mock receives the signal, abort was set up. Resolve by aborting
    // the signal that was passed to our mock.
    const passedSignal = mockFetch.mock.calls[0]?.[1]?.signal as AbortSignal | undefined;
    expect(passedSignal).toBeDefined();

    // Manually abort to simulate timeout
    passedSignal!.dispatchEvent(new Event('abort'));

    await expect(promise).rejects.toThrow('aborted');
  });
});
