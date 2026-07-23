import type {
  BootstrapData,
  FixturesData,
  Player,
  RankedPlayer,
  FixtureRun,
  CaptaincySuggestion,
  DerivedStats,
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

  return {
    generatedAt: new Date().toISOString(),
    currentEventId: currentEvent?.id ?? null,
    topScorers,
    mostTransferredIn,
    mostTransferredOut,
    priceRisers,
    priceFallers,
    ownershipLeaders,
    formLeaders,
    valuePicks,
    differentials,
    fixtureRuns,
    captaincySuggestions,
  };
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
