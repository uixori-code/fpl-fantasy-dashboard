import { loadBootstrap, loadDerivedStats } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import PlayerTable from '../components/PlayerTable';
import { formatCost, playerName, teamShortName } from '../lib/format';

export default function Statistics() {
  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived] = await Promise.all([loadBootstrap(), loadDerivedStats()]);
    return { bootstrap, derived };
  });

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived } = data;
  const { players, teams } = bootstrap;

  const setPieceRows = (derived.setPieceTakers ?? []).filter(
    (t) => t.penalties.length || t.directFreeKicks.length || t.corners.length,
  );

  const names = (list: { playerId: number }[]) =>
    list.length ? list.map((s) => playerName(players, s.playerId)).join(' / ') : '—';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-3">
          Price Change Predictions <span className="text-xs font-normal text-slate-500">(heuristic, not official)</span>
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <PlayerTable
            title="Likely to Rise Tonight"
            rows={derived.predictedRisers ?? []}
            players={players}
            teams={teams}
            valueLabel="Net Transfers"
            formatValue={(v) => `+${v.toLocaleString()}`}
            showWatchlist
          />
          <PlayerTable
            title="Likely to Fall Tonight"
            rows={derived.predictedFallers ?? []}
            players={players}
            teams={teams}
            valueLabel="Net Transfers"
            formatValue={(v) => v.toLocaleString()}
            showWatchlist
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PlayerTable
          title="Top Scorers"
          rows={derived.topScorers}
          players={players}
          teams={teams}
          valueLabel="Points"
          showWatchlist
        />
        <PlayerTable
          title="Template Team (most-owned XI)"
          rows={derived.templateTeam ?? []}
          players={players}
          teams={teams}
          valueLabel="Owned %"
          formatValue={(v) => `${v}%`}
          showWatchlist
        />
        <PlayerTable
          title="Most Transferred In"
          rows={derived.mostTransferredIn}
          players={players}
          teams={teams}
          valueLabel="Transfers In"
          formatValue={(v) => v.toLocaleString()}
          showWatchlist
        />
        <PlayerTable
          title="Most Transferred Out"
          rows={derived.mostTransferredOut}
          players={players}
          teams={teams}
          valueLabel="Transfers Out"
          formatValue={(v) => v.toLocaleString()}
          showWatchlist
        />
        <PlayerTable
          title="Price Risers (already happened)"
          rows={derived.priceRisers}
          players={players}
          teams={teams}
          valueLabel="Change"
          formatValue={(v) => `+${formatCost(v)}`}
          showWatchlist
        />
        <PlayerTable
          title="Price Fallers (already happened)"
          rows={derived.priceFallers}
          players={players}
          teams={teams}
          valueLabel="Change"
          formatValue={(v) => `-${formatCost(v)}`}
          showWatchlist
        />
        <PlayerTable
          title="Ownership Leaders"
          rows={derived.ownershipLeaders}
          players={players}
          teams={teams}
          valueLabel="Owned %"
          formatValue={(v) => `${v}%`}
          showWatchlist
        />
        <PlayerTable
          title="In-Form Players"
          rows={derived.formLeaders}
          players={players}
          teams={teams}
          valueLabel="Form"
          showWatchlist
        />
        <PlayerTable
          title="Best Value (pts per £m)"
          rows={derived.valuePicks}
          players={players}
          teams={teams}
          valueLabel="Pts/£m"
          formatValue={(v) => v.toFixed(1)}
          showWatchlist
        />
        <PlayerTable
          title="Differentials (<10% owned)"
          rows={derived.differentials}
          players={players}
          teams={teams}
          valueLabel="Points"
          showWatchlist
        />
      </div>

      <div>
        <h2 className="font-semibold mb-3">Set-Piece Takers</h2>
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="px-4 py-2 font-medium">Team</th>
                <th className="px-4 py-2 font-medium">Penalties</th>
                <th className="px-4 py-2 font-medium">Direct Free Kicks</th>
                <th className="px-4 py-2 font-medium">Corners</th>
              </tr>
            </thead>
            <tbody>
              {setPieceRows.map((row) => (
                <tr key={row.teamId} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2 font-medium">{teamShortName(teams, row.teamId)}</td>
                  <td className="px-4 py-2 text-slate-300">{names(row.penalties)}</td>
                  <td className="px-4 py-2 text-slate-300">{names(row.directFreeKicks)}</td>
                  <td className="px-4 py-2 text-slate-300">{names(row.corners)}</td>
                </tr>
              ))}
              {setPieceRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    No set-piece data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
