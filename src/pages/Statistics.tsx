import { loadBootstrap, loadDerivedStats } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import PlayerTable from '../components/PlayerTable';
import { formatCost } from '../lib/format';

export default function Statistics() {
  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived] = await Promise.all([loadBootstrap(), loadDerivedStats()]);
    return { bootstrap, derived };
  });

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived } = data;
  const { players, teams } = bootstrap;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PlayerTable title="Top Scorers" rows={derived.topScorers} players={players} teams={teams} valueLabel="Points" />
      <PlayerTable
        title="Most Transferred In"
        rows={derived.mostTransferredIn}
        players={players}
        teams={teams}
        valueLabel="Transfers In"
        formatValue={(v) => v.toLocaleString()}
      />
      <PlayerTable
        title="Most Transferred Out"
        rows={derived.mostTransferredOut}
        players={players}
        teams={teams}
        valueLabel="Transfers Out"
        formatValue={(v) => v.toLocaleString()}
      />
      <PlayerTable
        title="Price Risers"
        rows={derived.priceRisers}
        players={players}
        teams={teams}
        valueLabel="Change"
        formatValue={(v) => `+${formatCost(v)}`}
      />
      <PlayerTable
        title="Price Fallers"
        rows={derived.priceFallers}
        players={players}
        teams={teams}
        valueLabel="Change"
        formatValue={(v) => `-${formatCost(v)}`}
      />
      <PlayerTable
        title="Ownership Leaders"
        rows={derived.ownershipLeaders}
        players={players}
        teams={teams}
        valueLabel="Owned %"
        formatValue={(v) => `${v}%`}
      />
      <PlayerTable title="In-Form Players" rows={derived.formLeaders} players={players} teams={teams} valueLabel="Form" />
      <PlayerTable
        title="Best Value (pts per £m)"
        rows={derived.valuePicks}
        players={players}
        teams={teams}
        valueLabel="Pts/£m"
        formatValue={(v) => v.toFixed(1)}
      />
      <PlayerTable
        title="Differentials (<10% owned)"
        rows={derived.differentials}
        players={players}
        teams={teams}
        valueLabel="Points"
      />
    </div>
  );
}
