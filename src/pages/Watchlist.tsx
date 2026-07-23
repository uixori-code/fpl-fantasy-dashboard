import { useState } from 'react';
import { loadBootstrap, loadDerivedStats } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import { getWatchlist, toggleWatchlist } from '../lib/storage';
import { formatCost, positionName, teamShortName } from '../lib/format';
import EmptyState from '../components/EmptyState';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<number[]>(getWatchlist());

  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived] = await Promise.all([loadBootstrap(), loadDerivedStats()]);
    return { bootstrap, derived };
  });

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived } = data;
  const fixtureRunByTeam = new Map(derived.fixtureRuns.map((r) => [r.teamId, r]));
  const watchedPlayers = watchlist
    .map((id) => bootstrap.players.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  if (watchedPlayers.length === 0) {
    return (
      <EmptyState title="Your watchlist is empty">
        Click the ★ next to any player on the Statistics page to track them here.
      </EmptyState>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-white/10">
            <th className="px-4 py-2 font-medium w-8" />
            <th className="px-4 py-2 font-medium">Player</th>
            <th className="px-4 py-2 font-medium">Team</th>
            <th className="px-4 py-2 font-medium">Pos</th>
            <th className="px-4 py-2 font-medium">Price</th>
            <th className="px-4 py-2 font-medium">Form</th>
            <th className="px-4 py-2 font-medium">Owned %</th>
            <th className="px-4 py-2 font-medium text-right">Next FDR</th>
          </tr>
        </thead>
        <tbody>
          {watchedPlayers.map((player) => {
            const run = fixtureRunByTeam.get(player.teamId);
            return (
              <tr key={player.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-2">
                  <button
                    onClick={() => setWatchlist(toggleWatchlist(player.id))}
                    className="text-accent"
                    aria-label="Remove from watchlist"
                  >
                    ★
                  </button>
                </td>
                <td className="px-4 py-2 font-medium">{player.webName}</td>
                <td className="px-4 py-2 text-slate-400">{teamShortName(bootstrap.teams, player.teamId)}</td>
                <td className="px-4 py-2 text-slate-400">{positionName(player.elementType)}</td>
                <td className="px-4 py-2 text-slate-400">{formatCost(player.nowCost)}</td>
                <td className="px-4 py-2 text-slate-400">{player.form}</td>
                <td className="px-4 py-2 text-slate-400">{player.selectedByPercent}%</td>
                <td className="px-4 py-2 text-right font-semibold text-accent">
                  {run?.nextDifficulties[0] ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
