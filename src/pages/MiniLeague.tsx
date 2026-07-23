import { useState } from 'react';
import { getLeagueId, setLeagueId, clearLeagueId } from '../lib/storage';
import { fetchLeagueStandings } from '../lib/fplLiveClient';
import { useAsyncData } from '../lib/useAsyncData';
import EmptyState from '../components/EmptyState';

export default function MiniLeague() {
  const [leagueId, setLeagueIdState] = useState(getLeagueId());
  const [input, setInput] = useState(leagueId ?? '');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { data, loading, error } = useAsyncData(async () => {
    if (!leagueId) return null;
    return fetchLeagueStandings(leagueId);
  }, [leagueId]);

  async function handleSave() {
    const id = input.trim();
    if (!/^\d+$/.test(id)) {
      setStatus('error');
      setMessage('League ID should be numbers only.');
      return;
    }
    setStatus('checking');
    setMessage('Verifying league…');
    try {
      await fetchLeagueStandings(id);
      setLeagueId(id);
      setLeagueIdState(id);
      setStatus('idle');
      setMessage('');
    } catch {
      setStatus('error');
      setMessage("Couldn't find that league. Double-check the ID.");
    }
  }

  function handleClear() {
    clearLeagueId();
    setLeagueIdState(null);
    setInput('');
  }

  if (!leagueId) {
    return (
      <div className="max-w-md space-y-4">
        <h2 className="font-semibold text-lg">Track a Mini-League</h2>
        <p className="text-sm text-slate-400">
          Find your league's ID in its FPL URL, e.g. <code>fantasy.premierleague.com/leagues/1234567/standings/c</code> —
          the number after <code>/leagues/</code>.
        </p>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. 1234567"
          className="w-full bg-white/5 border border-white/20 rounded-md px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={handleSave}
          disabled={status === 'checking'}
          className="bg-accent text-pitch font-semibold px-4 py-2 rounded-md text-sm disabled:opacity-50"
        >
          {status === 'checking' ? 'Checking…' : 'Track League'}
        </button>
        {message && <p className={`text-sm ${status === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message}</p>}
      </div>
    );
  }

  if (loading) return <p className="text-slate-400">Loading standings…</p>;
  if (error || !data) {
    return (
      <EmptyState title="Couldn't load this league">
        <p>{error ?? 'Unknown error.'}</p>
        <button onClick={handleClear} className="text-accent underline mt-2">
          Remove league
        </button>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{data.league.name}</h2>
        <button onClick={handleClear} className="text-xs text-slate-400 hover:text-slate-200 underline">
          Change league
        </button>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-white/10">
              <th className="px-4 py-2 font-medium">Rank</th>
              <th className="px-4 py-2 font-medium">Manager</th>
              <th className="px-4 py-2 font-medium">Team</th>
              <th className="px-4 py-2 font-medium">GW Points</th>
              <th className="px-4 py-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.standings.results.map((entry) => (
              <tr key={entry.entry} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-2 font-medium">{entry.rank}</td>
                <td className="px-4 py-2 text-slate-300">{entry.player_name}</td>
                <td className="px-4 py-2 text-slate-400">{entry.entry_name}</td>
                <td className="px-4 py-2 text-slate-400">{entry.event_total}</td>
                <td className="px-4 py-2 text-right font-semibold text-accent">{entry.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
