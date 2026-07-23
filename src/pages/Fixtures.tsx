import { loadBootstrap, loadDerivedStats } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import FDRGrid from '../components/FDRGrid';
import { playerName, teamShortName } from '../lib/format';

export default function Fixtures() {
  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived] = await Promise.all([loadBootstrap(), loadDerivedStats()]);
    return { bootstrap, derived };
  });

  if (loading) return <p className="text-slate-400">Loading…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold mb-3">Fixture Difficulty — Next 5 Gameweeks (best runs first)</h2>
        <FDRGrid teams={bootstrap.teams} fixtureRuns={derived.fixtureRuns} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg">
        <div className="px-4 py-3 border-b border-white/10 font-semibold">Captaincy Suggestions</div>
        <ul className="divide-y divide-white/5">
          {derived.captaincySuggestions.map((s) => {
            const player = bootstrap.players.find((p) => p.id === s.playerId);
            return (
              <li key={s.playerId} className="px-4 py-3 flex justify-between text-sm">
                <span className="font-medium">
                  {playerName(bootstrap.players, s.playerId)}
                  {player && <span className="text-slate-500"> ({teamShortName(bootstrap.teams, player.teamId)})</span>}
                </span>
                <span className="text-slate-400">{s.reason}</span>
                <span className="font-semibold text-accent">{s.score}</span>
              </li>
            );
          })}
          {derived.captaincySuggestions.length === 0 && (
            <li className="px-4 py-6 text-center text-slate-500">No suggestions yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
