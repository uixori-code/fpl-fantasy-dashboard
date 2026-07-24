import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getManagerId } from '../lib/storage';
import { fetchManagerEntry, fetchManagerHistory, fetchManagerPicks } from '../lib/fplLiveClient';
import { loadBootstrap, loadFixtures } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import PitchView from '../components/PitchView';

export default function MyTeam() {
  const managerId = getManagerId();

  const { data, loading, error } = useAsyncData(async () => {
    if (!managerId) return null;
    const [entry, history, bootstrap, fixtures] = await Promise.all([
      fetchManagerEntry(managerId),
      fetchManagerHistory(managerId),
      loadBootstrap(),
      loadFixtures(),
    ]);

    const targetEvent =
      entry.current_event ??
      bootstrap.events.find((e) => e.isNext)?.id ??
      bootstrap.events.find((e) => e.isCurrent)?.id ??
      bootstrap.events[0]?.id ??
      1;

    let picks = null;
    let picksError: string | null = null;
    try {
      picks = await fetchManagerPicks(managerId, targetEvent);
    } catch (err) {
      picksError = err instanceof Error ? err.message : String(err);
      console.error('Failed to load squad picks for event', targetEvent, err);
    }

    return { entry, history, bootstrap, fixtures, picks, picksError, targetEvent };
  }, [managerId]);

  if (!managerId) {
    return (
      <EmptyState title="No manager ID set yet">
        Head to <Link to="/settings" className="text-accent underline">Settings</Link> to add your FPL manager ID
        and see your squad, rank, and points history here.
      </EmptyState>
    );
  }

  if (loading) return <p className="text-slate-400">Loading your team…</p>;
  if (error || !data) {
    return (
      <EmptyState title="Couldn't load your team">
        {error ?? 'Unknown error.'} This can happen before your first gameweek has started — try again once your
        squad has played.
      </EmptyState>
    );
  }

  const { entry, history, bootstrap, fixtures, picks, picksError, targetEvent } = data;
  const chartData = history.current.map((h) => ({ gw: h.event, points: h.points, rank: h.overall_rank }));
  const fmt = (v: number | null) => (v == null ? '—' : v.toLocaleString());
  const targetDeadline = bootstrap.events.find((e) => e.id === targetEvent)?.deadlineTime;
  const targetDeadlineLabel = targetDeadline ? new Date(targetDeadline).toLocaleString() : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Team" value={entry.name} />
        <StatCard label="Overall Rank" value={fmt(entry.summary_overall_rank)} />
        <StatCard label="Total Points" value={fmt(entry.summary_overall_points)} />
        <StatCard label="Last GW Points" value={fmt(entry.summary_event_points)} />
      </div>

      {!picks && picksError && picksError.includes('404') && (
        <EmptyState title="Your squad isn't published yet">
          FPL doesn't release a gameweek's picks over its API until that gameweek's deadline passes
          {targetDeadlineLabel ? ` (${targetDeadlineLabel})` : ''}. This isn't something the dashboard can work around — it'll
          appear here automatically once the deadline hits, no need to keep checking for errors.
        </EmptyState>
      )}
      {!picks && picksError && !picksError.includes('404') && (
        <EmptyState title={`Couldn't load your squad for Gameweek ${targetEvent ?? '?'}`}>
          <span className="block">{picksError}</span>
          <span className="block mt-1 text-xs text-slate-500">
            If this keeps happening, screenshot this message so it can be diagnosed.
          </span>
        </EmptyState>
      )}
      {!picks && !picksError && chartData.length === 0 && (
        <EmptyState title="Your squad hasn't played a gameweek yet">
          Your points history and squad pitch view will appear here as soon as Gameweek 1 kicks off.
        </EmptyState>
      )}

      {chartData.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="font-semibold mb-2">Points by Gameweek</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis dataKey="gw" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #ffffff33' }} />
              <Line type="monotone" dataKey="points" stroke="#00ff87" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {picks && (
        <div>
          <div className="font-semibold mb-3">Current Squad</div>
          <PitchView picks={picks.picks} players={bootstrap.players} teams={bootstrap.teams} fixtures={fixtures.fixtures} />
        </div>
      )}
    </div>
  );
}
