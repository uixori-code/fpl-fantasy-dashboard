import { loadBootstrap, loadDerivedStats, loadMeta } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import StatCard from '../components/StatCard';
import { teamShortName } from '../lib/format';

export default function Overview() {
  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived, meta] = await Promise.all([loadBootstrap(), loadDerivedStats(), loadMeta()]);
    return { bootstrap, derived, meta };
  });

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived, meta } = data;
  const currentEvent = bootstrap.events.find((e) => e.id === derived.currentEventId);
  const nextEvent = bootstrap.events.find((e) => e.isNext);
  const injuries = bootstrap.players
    .filter((p) => p.status !== 'a' && p.news)
    .sort((a, b) => b.selectedByPercent - a.selectedByPercent)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Current Gameweek" value={currentEvent ? currentEvent.name : '—'} />
        <StatCard
          label="Next Deadline"
          value={nextEvent ? new Date(nextEvent.deadlineTime).toLocaleString() : '—'}
        />
        <StatCard label="Average Score" value={currentEvent ? String(currentEvent.averageEntryScore) : '—'} />
        <StatCard label="Highest Score" value={currentEvent?.highestScore != null ? String(currentEvent.highestScore) : '—'} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg">
        <div className="px-4 py-3 border-b border-white/10 font-semibold">Injuries &amp; News</div>
        <ul className="divide-y divide-white/5">
          {injuries.map((p) => (
            <li key={p.id} className="px-4 py-3 flex justify-between text-sm">
              <span className="font-medium">
                {p.webName} <span className="text-slate-500">({teamShortName(bootstrap.teams, p.teamId)})</span>
              </span>
              <span className="text-slate-400 text-right">{p.news}</span>
            </li>
          ))}
          {injuries.length === 0 && <li className="px-4 py-6 text-center text-slate-500">No news to report.</li>}
        </ul>
      </div>

      <p className="text-xs text-slate-500">Data last refreshed: {meta.lastCoreUpdate ? new Date(meta.lastCoreUpdate).toLocaleString() : 'never'}</p>
    </div>
  );
}
