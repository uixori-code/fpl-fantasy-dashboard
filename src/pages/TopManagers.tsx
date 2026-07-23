import { loadBootstrap, loadTopManagers } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import PlayerTable from '../components/PlayerTable';
import EmptyState from '../components/EmptyState';

export default function TopManagers() {
  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, topManagers] = await Promise.all([loadBootstrap(), loadTopManagers()]);
    return { bootstrap, topManagers };
  });

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, topManagers } = data;
  const { players, teams } = bootstrap;

  if (topManagers.sampleSize === 0) {
    return (
      <EmptyState title="No top-manager data yet">
        This aggregates picks from the top {50} managers in the official Overall league. It fills in once the
        season's first gameweek is underway and the scheduled data refresh has run.
      </EmptyState>
    );
  }

  const ownedRows = topManagers.mostOwnedAmongTop.map((o) => ({ playerId: o.playerId, value: o.percent }));
  const captainedRows = topManagers.mostCaptained.map((o) => ({ playerId: o.playerId, value: o.percent }));

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">
        Based on {topManagers.sampleSize} managers in the official Overall league (id {topManagers.leagueId}),
        gameweek {topManagers.eventId}. Generated{' '}
        {topManagers.generatedAt ? new Date(topManagers.generatedAt).toLocaleString() : 'never'}.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlayerTable
          title="Most Owned by Top Managers"
          rows={ownedRows}
          players={players}
          teams={teams}
          valueLabel="Owned %"
          formatValue={(v) => `${v}%`}
        />
        <PlayerTable
          title="Most Captained by Top Managers"
          rows={captainedRows}
          players={players}
          teams={teams}
          valueLabel="Captained %"
          formatValue={(v) => `${v}%`}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-white/5 border border-white/10 rounded-lg">
          <div className="px-4 py-3 border-b border-white/10 font-semibold">Formations</div>
          <ul className="divide-y divide-white/5">
            {topManagers.formationCounts.map((f) => (
              <li key={f.formation} className="px-4 py-2 flex justify-between text-sm">
                <span>{f.formation}</span>
                <span className="text-accent font-semibold">{f.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg">
          <div className="px-4 py-3 border-b border-white/10 font-semibold">Chip Usage This Gameweek</div>
          <ul className="divide-y divide-white/5">
            {topManagers.chipUsage.map((c) => (
              <li key={c.chip} className="px-4 py-2 flex justify-between text-sm">
                <span className="capitalize">{c.chip}</span>
                <span className="text-accent font-semibold">{c.count}</span>
              </li>
            ))}
            {topManagers.chipUsage.length === 0 && (
              <li className="px-4 py-6 text-center text-slate-500">No chips played.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
