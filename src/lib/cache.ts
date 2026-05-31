// Upstash Redis cache utility — getWithCache()
// All API-Football calls MUST go through this function.
// Never call API-Football directly elsewhere in the codebase.

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// API call limit constants
const API_DAILY_LIMIT = 100;
const API_CIRCUIT_BREAKER_THRESHOLD = 95;

/**
 * Returns the Redis key for the daily API call counter.
 * Resets automatically after 24h (TTL set on first INCR).
 */
function getDailyCounterKey(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `api:daily:count:${today}`;
}

/**
 * Cache key patterns:
 *   fixtures:date:YYYY-MM-DD          → fixture list for a day   (TTL: 24h)
 *   fixture:id:{id}:live              → live status for one match (TTL: 5min)
 *   fixture:id:{id}:ft                → final result              (TTL: 6h)
 */

interface GetWithCacheOptions {
  key: string;
  ttlSeconds: number;
  fetcher: () => Promise<unknown>;
}

/**
 * getWithCache — the single entry point for all external API calls.
 *
 * Steps:
 * 1. Check Redis for key → return cached value if hit
 * 2. Cache miss → check daily counter (circuit breaker at 95)
 * 3. If under limit → call fetcher, cache result, increment counter
 * 4. Return data (or null if circuit breaker tripped)
 */
export async function getWithCache<T>({
  key,
  ttlSeconds,
  fetcher,
}: GetWithCacheOptions): Promise<T | null> {
  // Step 1: Check cache
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch (err) {
    console.error('[Cache] Redis GET error:', err);
    // Fall through to fetch on Redis error
  }

  // Step 2: Cache miss — check daily counter
  const counterKey = getDailyCounterKey();
  let currentCount = 0;

  try {
    const count = await redis.get<number>(counterKey);
    currentCount = count ?? 0;
  } catch (err) {
    console.error('[Cache] Redis counter GET error:', err);
  }

  if (currentCount >= API_CIRCUIT_BREAKER_THRESHOLD) {
    console.warn(
      `[Cache] ⚠️ Circuit breaker tripped — daily API count: ${currentCount}/${API_DAILY_LIMIT}. Skipping fetch for key: ${key}`
    );
    return null;
  }

  // Step 3: Fetch fresh data
  let data: T;
  try {
    data = (await fetcher()) as T;
  } catch (err) {
    console.error(`[Cache] Fetcher error for key ${key}:`, err);
    throw err;
  }

  // Step 4: Write to cache + increment counter (fire-and-forget, don't block)
  Promise.all([
    redis.set(key, data, { ex: ttlSeconds }).catch((e) =>
      console.error('[Cache] Redis SET error:', e)
    ),
    redis
      .incr(counterKey)
      .then(async (newCount) => {
        // Set 24h TTL on first increment of the day
        if (newCount === 1) {
          await redis.expire(counterKey, 86400);
        }
      })
      .catch((e) => console.error('[Cache] Redis INCR error:', e)),
  ]);

  return data;
}

/**
 * Get the current daily API call count (for monitoring).
 */
export async function getDailyApiCount(): Promise<number> {
  try {
    const count = await redis.get<number>(getDailyCounterKey());
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.error('[Cache] Redis DEL error:', err);
  }
}

export { redis };

// Cache key helpers — use these constants everywhere to avoid typos
export const CacheKeys = {
  fixturesByDate: (date: string) => `fixtures:date:${date}`,
  fixtureLive: (fixtureId: number) => `fixture:id:${fixtureId}:live`,
  fixtureFT: (fixtureId: number) => `fixture:id:${fixtureId}:ft`,
};

// TTL constants (in seconds)
export const CacheTTL = {
  FIXTURES_DAILY: 86400,   // 24h — changes once per day after seeding
  FIXTURE_LIVE: 300,        // 5min — polled during active match window
  FIXTURE_FT: 21600,        // 6h — immutable once FT
};
