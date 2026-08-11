import type {
  BootstrapData,
  FixturesData,
  Player,
  RankedPlayer,
  FixtureRun,
  CaptaincySuggestion,
  DerivedStats,
  SetPieceTeam,
  GameweekAnomaly,
  DraftTier,
} from '../src/lib/types.ts';

const TOP_N = 15;

function topBy(players: Player[], selector: (p: Player) => number, n = TOP_N): RankedPlayer[] {
  return [...players]
    .sort((a, b) => selector(b) - selector(a))
    .slice(0, n)
    .map((p) => ({ playerId: p.id, value: selector(p) }));
}

export function computeDerivedStats(bootstrap: BootstrapData, fixturesData: FixturesData): DerivedStats {
  const { players, events } = bootstrap;
  const currentEvent = events.find((e) => e.isCurrent) ?? events.find((e) => e.isNext) ?? null;

  const played = players.filter((p) => p.minutes > 0);

  const topScorers = topBy(players, (p) => p.totalPoints);
  const mostTransferredIn = topBy(players, (p) => p.transfersInEvent);
  const mostTransferredOut = topBy(players, (p) => p.transfersOutEvent);
  const priceRisers = topBy(
    players.filter((p) => p.costChangeEvent > 0),
    (p) => p.costChangeEvent,
  );
  const priceFallers = topBy(
    players.filter((p) => p.costChangeEvent < 0),
    (p) => -p.costChangeEvent,
  );
  const ownershipLeaders = topBy(players, (p) => p.selectedByPercent);
  const formLeaders = topBy(
    played,
    (p) => p.form,
  );
  const valuePicks = topBy(
    played.filter((p) => p.minutes >= 300 && p.nowCost > 0),
    (p) => p.totalPoints / (p.nowCost / 10),
  );

  const medianForm = median(played.map((p) => p.form));
  const differentials = topBy(
    played.filter((p) => p.selectedByPercent < 10 && p.form >= medianForm),
    (p) => p.totalPoints,
  );

  const fixtureRuns = computeFixtureRuns(bootstrap, fixturesData);
  const captaincySuggestions = computeCaptaincySuggestions(players, fixtureRuns);
  const { predictedRisers, predictedFallers } = computePredictedPriceChanges(players);
  const templateTeam = computeTemplateTeam(players);
  const setPieceTakers = computeSetPieceTakers(bootstrap);
  const gameweekAnomalies = computeGameweekAnomalies(fixturesData);
  const draftRanks = computeDraftRanks(players, fixtureRuns);
  const draftTiers = computeDraftTiers(players, draftRanks);

  return {
    generatedAt: new Date().toISOString(),
    currentEventId: currentEvent?.id ?? null,
    topScorers,
    mostTransferredIn,
    mostTransferredOut,
    priceRisers,
    priceFallers,
    predictedRisers,
    predictedFallers,
    ownershipLeaders,
    formLeaders,
    valuePicks,
    differentials,
    templateTeam,
    fixtureRuns,
    captaincySuggestions,
    setPieceTakers,
    gameweekAnomalies,
    draftRanks,
    draftTiers,
  };
}

/**
 * Heuristic only — FPL doesn't publish its price-change algorithm. Ranks players by net
 * transfers this event as a proxy for who's closest to tonight's price change.
 */
function computePredictedPriceChanges(players: Player[]): {
  predictedRisers: RankedPlayer[];
  predictedFallers: RankedPlayer[];
} {
  const withNet = players.map((p) => ({ playerId: p.id, net: p.transfersInEvent - p.transfersOutEvent }));

  const predictedRisers = [...withNet]
    .filter((p) => p.net > 0)
    .sort((a, b) => b.net - a.net)
    .slice(0, 10)
    .map((p) => ({ playerId: p.playerId, value: p.net }));

  const predictedFallers = [...withNet]
    .filter((p) => p.net < 0)
    .sort((a, b) => a.net - b.net)
    .slice(0, 10)
    .map((p) => ({ playerId: p.playerId, value: p.net }));

  return { predictedRisers, predictedFallers };
}

/** Most-owned valid XI: fills position minimums by ownership, then tops up by ownership within caps. */
function computeTemplateTeam(players: Player[]): RankedPlayer[] {
  const byOwnership = [...players].sort((a, b) => b.selectedByPercent - a.selectedByPercent);
  const caps: Record<number, number> = { 1: 1, 2: 5, 3: 5, 4: 3 };
  const mins: Record<number, number> = { 1: 1, 2: 3, 3: 2, 4: 1 };
  const picked: Player[] = [];
  const countByType: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const type of [1, 2, 3, 4] as const) {
    for (const p of byOwnership) {
      if (picked.includes(p)) continue;
      if (p.elementType !== type) continue;
      if (countByType[type] >= mins[type]) break;
      picked.push(p);
      countByType[type]++;
    }
  }

  for (const p of byOwnership) {
    if (picked.length >= 11) break;
    if (picked.includes(p)) continue;
    if (countByType[p.elementType] >= caps[p.elementType]) continue;
    picked.push(p);
    countByType[p.elementType]++;
  }

  return picked.map((p) => ({ playerId: p.id, value: p.selectedByPercent }));
}

function computeSetPieceTakers(bootstrap: BootstrapData): SetPieceTeam[] {
  return bootstrap.teams.map((team) => {
    const teamPlayers = bootstrap.players.filter((p) => p.teamId === team.id);
    const byOrder = (selector: (p: Player) => number | null) =>
      teamPlayers
        .filter((p) => selector(p) != null)
        .sort((a, b) => (selector(a) as number) - (selector(b) as number))
        .slice(0, 3)
        .map((p) => ({ playerId: p.id, order: selector(p) as number }));

    return {
      teamId: team.id,
      penalties: byOrder((p) => p.penaltiesOrder),
      directFreeKicks: byOrder((p) => p.directFreekicksOrder),
      corners: byOrder((p) => p.cornersOrder),
    };
  });
}

function computeGameweekAnomalies(fixturesData: FixturesData): GameweekAnomaly[] {
  const countByEventTeam = new Map<number, Map<number, number>>();

  for (const f of fixturesData.fixtures) {
    if (f.event == null) continue;
    if (!countByEventTeam.has(f.event)) countByEventTeam.set(f.event, new Map());
    const teamCounts = countByEventTeam.get(f.event)!;
    teamCounts.set(f.teamH, (teamCounts.get(f.teamH) ?? 0) + 1);
    teamCounts.set(f.teamA, (teamCounts.get(f.teamA) ?? 0) + 1);
  }

  const allTeamIds = new Set<number>();
  for (const f of fixturesData.fixtures) {
    allTeamIds.add(f.teamH);
    allTeamIds.add(f.teamA);
  }

  const anomalies: GameweekAnomaly[] = [];
  for (const [eventId, teamCounts] of [...countByEventTeam.entries()].sort((a, b) => a[0] - b[0])) {
    const doubleTeams = [...teamCounts.entries()].filter(([, count]) => count >= 2).map(([teamId]) => teamId);
    const blankTeams = [...allTeamIds].filter((teamId) => (teamCounts.get(teamId) ?? 0) === 0);
    if (doubleTeams.length > 0 || blankTeams.length > 0) {
      anomalies.push({ eventId, doubleTeams, blankTeams });
    }
  }

  return anomalies;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeFixtureRuns(bootstrap: BootstrapData, fixturesData: FixturesData): FixtureRun[] {
  const upcoming = fixturesData.fixtures
    .filter((f) => !f.finished)
    .sort((a, b) => (a.kickoffTime ?? '').localeCompare(b.kickoffTime ?? ''));

  return bootstrap.teams.map((team) => {
    const teamFixtures = upcoming
      .filter((f) => f.teamH === team.id || f.teamA === team.id)
      .slice(0, 5);

    const nextDifficulties = teamFixtures.map((f) => (f.teamH === team.id ? f.teamHDifficulty : f.teamADifficulty));

    const avg = nextDifficulties.length
      ? nextDifficulties.reduce((sum, d) => sum + d, 0) / nextDifficulties.length
      : 3;

    return {
      teamId: team.id,
      avgDifficultyNext5: Math.round(avg * 100) / 100,
      nextDifficulties,
    };
  });
}

function computeCaptaincySuggestions(players: Player[], fixtureRuns: FixtureRun[]): CaptaincySuggestion[] {
  const difficultyByTeam = new Map(fixtureRuns.map((r) => [r.teamId, r.nextDifficulties[0] ?? 3]));

  const eligible = players.filter((p) => p.status === 'a' && p.minutes > 0 && p.elementType >= 3);

  const scored = eligible.map((p) => {
    const nextDifficulty = difficultyByTeam.get(p.teamId) ?? 3;
    const score = p.form * (6 - nextDifficulty);
    return {
      playerId: p.id,
      score: Math.round(score * 100) / 100,
      reason: `Form ${p.form.toFixed(1)}, next fixture difficulty ${nextDifficulty}`,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

/** How much a player's availability status discounts their draft value. */
function statusMultiplier(status: Player['status']): number {
  switch (status) {
    case 'a':
      return 1;
    case 'd': // doubtful
      return 0.75;
    case 'i': // injured
    case 's': // suspended
      return 0.35;
    default: // unavailable / not in squad
      return 0.1;
  }
}

/**
 * Draft value is deliberately price-agnostic: FPL Draft has no budget, so points-per-million
 * (the classic `valuePicks` metric) is meaningless here. Instead a player is worth their season
 * points, nudged by per-game quality so someone excellent-but-injured isn't buried beneath a
 * full-season journeyman, then discounted for thin minutes, hard upcoming fixtures, and injury.
 *
 * Limitation: this only knows what the FPL API publishes, so incoming transfers with no Premier
 * League history score ~0 and will rank near the bottom regardless of real-world quality.
 */
function computeDraftRanks(players: Player[], fixtureRuns: FixtureRun[]): RankedPlayer[] {
  const difficultyByTeam = new Map(fixtureRuns.map((r) => [r.teamId, r.avgDifficultyNext5]));

  return players
    .map((p) => {
      const avgDifficulty = difficultyByTeam.get(p.teamId) ?? 3;
      // FDR 2 -> 1.33x, FDR 3 -> 1.0x, FDR 4 -> 0.67x
      const fixtureMultiplier = (6 - avgDifficulty) / 3;
      // Full credit at ~1500 minutes; never drops below 0.7 so low-minute talent stays visible.
      const availability = 0.7 + 0.3 * Math.min(p.minutes / 1500, 1);
      const base = p.totalPoints + p.pointsPerGame * 10;
      const score = base * availability * fixtureMultiplier * statusMultiplier(p.status);

      return { playerId: p.id, value: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.value - a.value);
}

const DRAFT_TIER_POOL = 40; // players per position worth tiering; the rest is undrafted noise
const MAX_TIER_SIZE = 8;

/**
 * Groups each position's top players into tiers by cutting where consecutive draft scores drop
 * unusually far. Tiers are the point of a big board: they say "these are interchangeable, and
 * there's a cliff after them", which is what actually drives a draft-day decision.
 */
function computeDraftTiers(players: Player[], draftRanks: RankedPlayer[]): DraftTier[] {
  const scoreById = new Map(draftRanks.map((r) => [r.playerId, r.value]));
  const tiers: DraftTier[] = [];

  for (const elementType of [1, 2, 3, 4] as const) {
    const pool = players
      .filter((p) => p.elementType === elementType)
      .map((p) => ({ playerId: p.id, value: scoreById.get(p.id) ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, DRAFT_TIER_POOL);

    if (pool.length === 0) continue;

    const gaps = pool.slice(1).map((entry, i) => pool[i].value - entry.value);
    const meanGap = gaps.length ? gaps.reduce((sum, g) => sum + g, 0) / gaps.length : 0;
    const gapThreshold = meanGap * 1.5;

    let tierNumber = 1;
    let current: number[] = [];

    for (let i = 0; i < pool.length; i++) {
      const isBigDrop = i > 0 && pool[i - 1].value - pool[i].value > gapThreshold;
      if (current.length > 0 && (isBigDrop || current.length >= MAX_TIER_SIZE)) {
        tiers.push({ elementType, tier: tierNumber++, playerIds: current });
        current = [];
      }
      current.push(pool[i].playerId);
    }

    if (current.length > 0) {
      tiers.push({ elementType, tier: tierNumber, playerIds: current });
    }
  }

  return tiers;
}
