import { loadBootstrap, loadDerivedStats } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import { getManagerId } from '../lib/storage';
import { fetchManagerEntry, fetchManagerPicks } from '../lib/fplLiveClient';
import { teamShortName, positionName, formatCost } from '../lib/format';
import type { Player } from '../lib/types';

interface Suggestion {
  playerId: number;
  reason: string;
  ownedByYou: boolean;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function statusLabel(status: Player['status']): string {
  switch (status) {
    case 'i':
      return 'Injured';
    case 's':
      return 'Suspended';
    case 'd':
      return 'Doubtful';
    case 'u':
      return 'Unavailable';
    case 'n':
      return 'Not in squad';
    default:
      return 'Available';
  }
}

export default function Transfers() {
  const managerId = getManagerId();

  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived] = await Promise.all([loadBootstrap(), loadDerivedStats()]);
    let ownedIds = new Set<number>();
    if (managerId) {
      try {
        const entry = await fetchManagerEntry(managerId);
        if (entry.current_event) {
          const picks = await fetchManagerPicks(managerId, entry.current_event);
          ownedIds = new Set(picks.picks.map((p) => p.element));
        }
      } catch {
        // Fall back to generic (non-personalized) suggestions.
      }
    }
    return { bootstrap, derived, ownedIds };
  }, [managerId]);

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived, ownedIds } = data;
  const { players, teams } = bootstrap;
  const fixtureRunByTeam = new Map(derived.fixtureRuns.map((r) => [r.teamId, r]));
  const played = players.filter((p) => p.minutes > 0);
  const medianForm = median(played.map((p) => p.form));

  const outSuggestions: Suggestion[] = [];
  for (const p of players) {
    if (p.status !== 'a' && p.news) {
      outSuggestions.push({
        playerId: p.id,
        reason: `${statusLabel(p.status)} — ${p.news}`,
        ownedByYou: ownedIds.has(p.id),
      });
    }
  }
  for (const p of played) {
    if (p.status !== 'a') continue;
    const run = fixtureRunByTeam.get(p.teamId);
    if (run && run.avgDifficultyNext5 >= 4 && p.form < medianForm) {
      outSuggestions.push({
        playerId: p.id,
        reason: `Tough fixture run (avg FDR ${run.avgDifficultyNext5}) and out of form (${p.form.toFixed(1)})`,
        ownedByYou: ownedIds.has(p.id),
      });
    }
  }
  outSuggestions.sort((a, b) => Number(b.ownedByYou) - Number(a.ownedByYou));

  const outIds = new Set(outSuggestions.map((s) => s.playerId));
  const inSuggestions: Suggestion[] = played
    .filter((p) => p.status === 'a' && !outIds.has(p.id))
    .map((p) => {
      const run = fixtureRunByTeam.get(p.teamId);
      const fixtureScore = run ? 6 - run.avgDifficultyNext5 : 3;
      return { player: p, score: p.form * fixtureScore, run };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ player, run }) => ({
      playerId: player.id,
      reason: `Good form (${player.form.toFixed(1)}) and favorable fixtures (avg FDR ${run?.avgDifficultyNext5 ?? '—'})`,
      ownedByYou: false,
    }));

  const renderList = (title: string, list: Suggestion[], emptyText: string) => (
    <div className="bg-white/5 border border-white/10 rounded-lg">
      <div className="px-4 py-3 border-b border-white/10 font-semibold">{title}</div>
      <ul className="divide-y divide-white/5">
        {list.slice(0, 10).map((s) => {
          const player = players.find((p) => p.id === s.playerId);
          if (!player) return null;
          return (
            <li key={s.playerId} className="px-4 py-3 flex justify-between text-sm gap-3">
              <span className="font-medium whitespace-nowrap">
                {player.webName}{' '}
                <span className="text-slate-500">
                  ({teamShortName(teams, player.teamId)}, {positionName(player.elementType)}, {formatCost(player.nowCost)})
                </span>
                {s.ownedByYou && (
                  <span className="ml-2 text-xs bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded align-middle">
                    In your squad
                  </span>
                )}
              </span>
              <span className="text-slate-400 text-right">{s.reason}</span>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-4 py-6 text-center text-slate-500">{emptyText}</li>}
      </ul>
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Heuristic suggestions based on form, fixtures, and availability — always check the latest news before making a
        transfer. These aren't executed for you; use them as a starting point on the official site.
        {!managerId && ' Add your manager ID in Settings to flag players already in your squad.'}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        {renderList('Consider Selling', outSuggestions, 'No obvious sell candidates right now.')}
        {renderList('Consider Buying', inSuggestions, 'No suggestions yet.')}
      </div>
    </div>
  );
}
