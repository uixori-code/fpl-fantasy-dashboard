import { fplGet } from './lib/fplClient.ts';
import { mapWithLimit } from './lib/rateLimit.ts';
import type { BootstrapData, TopManagersData, OwnedCount, FormationCount, ChipUsageCount } from '../src/lib/types.ts';

const LEAGUE_ID = 314; // official "Overall" global league
const SAMPLE_SIZE = 50;
const CONCURRENCY = 5;
const STAGGER_MS = 300;

interface StandingsResponse {
  standings: {
    results: Array<{ entry: number }>;
  };
}

interface PicksResponse {
  active_chip: string | null;
  picks: Array<{
    element: number;
    position: number;
    multiplier: number;
    is_captain: boolean;
  }>;
}

function toSortedCounts(counts: Map<number, number>, sampleSize: number): OwnedCount[] {
  return [...counts.entries()]
    .map(([playerId, count]) => ({ playerId, count, percent: Math.round((count / sampleSize) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchTopManagerInsights(bootstrap: BootstrapData): Promise<TopManagersData> {
  const currentEvent = bootstrap.events.find((e) => e.isCurrent) ?? bootstrap.events.find((e) => e.isNext);
  const eventId = currentEvent?.id ?? null;

  if (!eventId) {
    return {
      generatedAt: new Date().toISOString(),
      leagueId: LEAGUE_ID,
      eventId: null,
      sampleSize: 0,
      mostOwnedAmongTop: [],
      mostCaptained: [],
      formationCounts: [],
      chipUsage: [],
    };
  }

  const standings = await fplGet<StandingsResponse>(`/leagues-classic/${LEAGUE_ID}/standings/?page_standings=1`);
  const managerIds = standings.standings.results.slice(0, SAMPLE_SIZE).map((r) => r.entry);

  const elementTypeById = new Map(bootstrap.players.map((p) => [p.id, p.elementType]));

  const results = await mapWithLimit(managerIds, CONCURRENCY, STAGGER_MS, (id) =>
    fplGet<PicksResponse>(`/entry/${id}/event/${eventId}/picks/`),
  );

  const ownedCounts = new Map<number, number>();
  const captainCounts = new Map<number, number>();
  const formationCounts = new Map<string, number>();
  const chipCounts = new Map<string, number>();

  let sampleSize = 0;
  for (const { result } of results) {
    if (!result) continue;
    sampleSize++;

    const starters = result.picks.filter((p) => p.position <= 11);
    for (const pick of starters) {
      ownedCounts.set(pick.element, (ownedCounts.get(pick.element) ?? 0) + 1);
      if (pick.is_captain) {
        captainCounts.set(pick.element, (captainCounts.get(pick.element) ?? 0) + 1);
      }
    }

    const positionCounts = { def: 0, mid: 0, fwd: 0 };
    for (const pick of starters) {
      const type = elementTypeById.get(pick.element);
      if (type === 2) positionCounts.def++;
      else if (type === 3) positionCounts.mid++;
      else if (type === 4) positionCounts.fwd++;
    }
    const formation = `${positionCounts.def}-${positionCounts.mid}-${positionCounts.fwd}`;
    formationCounts.set(formation, (formationCounts.get(formation) ?? 0) + 1);

    if (result.active_chip) {
      chipCounts.set(result.active_chip, (chipCounts.get(result.active_chip) ?? 0) + 1);
    }
  }

  const formations: FormationCount[] = [...formationCounts.entries()]
    .map(([formation, count]) => ({ formation, count }))
    .sort((a, b) => b.count - a.count);

  const chipUsage: ChipUsageCount[] = [...chipCounts.entries()]
    .map(([chip, count]) => ({ chip, count }))
    .sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    leagueId: LEAGUE_ID,
    eventId,
    sampleSize,
    mostOwnedAmongTop: toSortedCounts(ownedCounts, sampleSize).slice(0, 15),
    mostCaptained: toSortedCounts(captainCounts, sampleSize).slice(0, 10),
    formationCounts: formations,
    chipUsage,
  };
}
