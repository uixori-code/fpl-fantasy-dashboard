const BASE_URL = 'https://fantasy.premierleague.com/api';
const TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET a path from the official FPL API with a timeout and exponential
 * backoff retry on 429/5xx. Throws on final failure.
 */
export async function fplGet<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'fpl-fantasy-dashboard/1.0 (+https://github.com/uixori-code/fpl-fantasy-dashboard)',
          Accept: 'application/json',
        },
      });

      if (res.status === 429 || res.status >= 500) {
        throw new Error(`FPL API responded ${res.status} for ${path}`);
      }
      if (!res.ok) {
        throw new Error(`FPL API error ${res.status} for ${path}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(2 ** attempt * 1000);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Failed to fetch ${path} after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`);
}
