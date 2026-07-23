import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getManagerId } from '../lib/storage';
import { fetchManagerEntry, fetchManagerHistory, fetchManagerPicks } from '../lib/fplLiveClient';
import { loadBootstrap } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { formatCost, positionName, teamShortName } from '../lib/format';

export default function MyTeam() {
  const managerId = getManagerId();

  const { data, loading, error } = useAsyncData(async () => {
    if (!managerId) return null;
    const [entry, history, bootstrap] = await Promise.all([
      fetchManagerEntry(managerId),
      fetchManagerHistory(managerId),
      loadBootstrap(),
    ]);
    const picks = entry.current_event ? await fetchManagerPicks(managerId, entry.current_event) : null;
    return { entry, history, bootstrap, picks };
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

  const { entry, history, bootstrap, picks } = data;
  const chartData = history.current.map((h) => ({ gw: h.event, points: h.points, rank: h.overall_rank }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Team" value={entry.name} />
        <StatCard label="Overall Rank" value={entry.summary_overall_rank?.toLocaleString() ?? '—'} />
        <StatCard label="Total Points" value={String(entry.summary_overall_points)} />
        <StatCard label="Last GW Points" value={String(entry.summary_event_points)} />
      </div>

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
        <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 font-semibold">Current Squad</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="px-4 py-2 font-medium">Player</th>
                <th className="px-4 py-2 font-medium">Team</th>
                <th className="px-4 py-2 font-medium">Pos</th>
                <th className="px-4 py-2 font-medium">Price</th>
                <th className="px-4 py-2 font-medium text-right">Role</th>
              </tr>
            </thead>
            <tbody>
              {picks.picks.map((pick) => {
                const player = bootstrap.players.find((p) => p.id === pick.element);
                if (!player) return null;
                return (
                  <tr key={pick.element} className={`border-b border-white/5 last:border-0 ${pick.position > 11 ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2 font-medium">{player.webName}</td>
                    <td className="px-4 py-2 text-slate-400">{teamShortName(bootstrap.teams, player.teamId)}</td>
                    <td className="px-4 py-2 text-slate-400">{positionName(player.elementType)}</td>
                    <td className="px-4 py-2 text-slate-400">{formatCost(player.nowCost)}</td>
                    <td className="px-4 py-2 text-right text-accent font-semibold">
                      {pick.is_captain ? 'Captain' : pick.is_vice_captain ? 'Vice-Captain' : pick.position > 11 ? 'Bench' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
