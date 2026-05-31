// API-Football v3 integration
// All calls go through getWithCache() — never call fetch() directly elsewhere.

import { getWithCache, CacheKeys, CacheTTL } from './cache';
import { Fixture, FixtureStatus, PredictionResult } from './types';

const API_BASE = 'https://v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;    // API-Football league ID for FIFA World Cup
const WORLD_CUP_SEASON = 2026;

// ─── Raw API Types ────────────────────────────────────────────────────────────

interface ApiFixtureResponse {
  fixture: {
    id: number;
    date: string;         // ISO 8601 UTC
    status: { short: string; elapsed: number | null };
  };
  league: { id: number; season: number };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
}

interface ApiResponse<T> {
  results: number;
  response: T[];
  errors: Record<string, string>;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function apiFetch<T>(endpoint: string): Promise<ApiResponse<T>> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) throw new Error('FOOTBALL_API_KEY is not configured');

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
    next: { revalidate: 0 }, // Never cache at Next.js level — we use Redis
  });

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText} — ${url}`);
  }

  return res.json();
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

/** Convert API status short code to our FixtureStatus type */
function normaliseStatus(short: string): FixtureStatus {
  const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'];
  if (liveStatuses.includes(short)) return short as FixtureStatus;
  if (short === 'FT' || short === 'AET' || short === 'PEN') return 'FT';
  if (short === 'VOID' || short === 'CANC' || short === 'ABD') return 'VOID';
  return 'NS'; // Not started
}

/** Determine match result from final scores */
function determineResult(
  homeScore: number | null,
  awayScore: number | null
): PredictionResult | null {
  if (homeScore === null || awayScore === null) return null;
  if (homeScore > awayScore) return 'H';
  if (awayScore > homeScore) return 'A';
  return 'D';
}

/** Format a UTC ISO date string as IST time (e.g. "9:30 PM IST") */
function formatKickoffIST(utcDate: string): string {
  const date = new Date(utcDate);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
}

/** Extract YYYY-MM-DD in IST from UTC date string */
function getISTDate(utcDate: string): string {
  const date = new Date(utcDate);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
}

/** Map raw API fixture to our Fixture type */
function mapApiFixture(raw: ApiFixtureResponse): Fixture {
  const status = normaliseStatus(raw.fixture.status.short);
  const homeScore = raw.goals.home;
  const awayScore = raw.goals.away;

  return {
    fixture_id: raw.fixture.id,
    match_date: getISTDate(raw.fixture.date),
    kickoff_utc: raw.fixture.date,
    kickoff_ist: formatKickoffIST(raw.fixture.date),
    home_team: raw.teams.home.name,
    away_team: raw.teams.away.name,
    home_team_logo: raw.teams.home.logo,
    away_team_logo: raw.teams.away.logo,
    home_score: homeScore,
    away_score: awayScore,
    status,
    result: status === 'FT' ? determineResult(homeScore, awayScore) : null,
  };
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetch fixtures for a given date (YYYY-MM-DD in IST).
 * Cached for 24h in Upstash Redis.
 */
export async function getFixturesByDate(date: string): Promise<Fixture[]> {
  const cacheKey = CacheKeys.fixturesByDate(date);

  const result = await getWithCache<Fixture[]>({
    key: cacheKey,
    ttlSeconds: CacheTTL.FIXTURES_DAILY,
    fetcher: async () => {
      const data = await apiFetch<ApiFixtureResponse>(
        `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}&date=${date}`
      );

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('[API-Football] Errors:', data.errors);
        throw new Error('API-Football returned errors');
      }

      return data.response.map(mapApiFixture);
    },
  });

  return result ?? [];
}

/**
 * Fetch live status for a single fixture.
 * Cached for 5 minutes in Upstash Redis.
 */
export async function getLiveFixture(fixtureId: number): Promise<Fixture | null> {
  const cacheKey = CacheKeys.fixtureLive(fixtureId);

  const result = await getWithCache<Fixture>({
    key: cacheKey,
    ttlSeconds: CacheTTL.FIXTURE_LIVE,
    fetcher: async () => {
      const data = await apiFetch<ApiFixtureResponse>(`/fixtures?id=${fixtureId}`);
      if (!data.response.length) throw new Error(`Fixture ${fixtureId} not found`);
      return mapApiFixture(data.response[0]);
    },
  });

  return result;
}

/**
 * Fetch all currently live World Cup fixtures.
 * Used by LivePollCron to detect which matches need status updates.
 */
export async function getLiveFixtures(): Promise<Fixture[]> {
  // We don't cache this — it's a realtime check used by cron
  try {
    const data = await apiFetch<ApiFixtureResponse>(
      `/fixtures?league=${WORLD_CUP_LEAGUE_ID}&season=${WORLD_CUP_SEASON}&live=all`
    );
    return data.response.map(mapApiFixture);
  } catch (err) {
    console.error('[API-Football] getLiveFixtures error:', err);
    return [];
  }
}

/**
 * Fetch and cache the final result for a completed fixture.
 * Long TTL (6h) since FT result is immutable.
 */
export async function getFixtureResult(fixtureId: number): Promise<Fixture | null> {
  const cacheKey = CacheKeys.fixtureFT(fixtureId);

  const result = await getWithCache<Fixture>({
    key: cacheKey,
    ttlSeconds: CacheTTL.FIXTURE_FT,
    fetcher: async () => {
      const data = await apiFetch<ApiFixtureResponse>(`/fixtures?id=${fixtureId}`);
      if (!data.response.length) throw new Error(`Fixture ${fixtureId} not found`);
      return mapApiFixture(data.response[0]);
    },
  });

  return result;
}

// Export helpers for use in cron routes
export { getISTDate, formatKickoffIST };
