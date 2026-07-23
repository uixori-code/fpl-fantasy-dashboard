import pLimit from 'p-limit';

/** Concurrency-capped, lightly-staggered map over items, for bulk manager-picks fetches. */
export async function mapWithLimit<T, R>(
  items: T[],
  concurrency: number,
  staggerMs: number,
  fn: (item: T) => Promise<R>,
): Promise<Array<{ item: T; result?: R; error?: unknown }>> {
  const limit = pLimit(concurrency);
  let index = 0;

  const tasks = items.map((item) =>
    limit(async () => {
      const delay = (index++ % concurrency) * staggerMs;
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      try {
        const result = await fn(item);
        return { item, result };
      } catch (error) {
        return { item, error };
      }
    }),
  );

  return Promise.all(tasks);
}
