import type { Fixture, Player, Team } from '../lib/types';
import type { ManagerPick } from '../lib/fplLiveClient';
import { nextFixtureLabel, positionName, teamShortName } from '../lib/format';
import { teamColor } from '../lib/teamColors';

const JERSEY_CLIP =
  'polygon(20% 0%, 35% 0%, 50% 15%, 65% 0%, 80% 0%, 100% 20%, 85% 35%, 85% 100%, 15% 100%, 15% 35%, 0% 20%)';

function PlayerChip({
  pick,
  player,
  teams,
  fixtures,
}: {
  pick: ManagerPick;
  player: Player;
  teams: Team[];
  fixtures: Fixture[];
}) {
  const shortName = teamShortName(teams, player.teamId);
  const color = teamColor(shortName, player.teamId);

  return (
    <div className="flex flex-col items-center w-24">
      <div className="relative">
        <div
          className="w-14 h-14 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: color, clipPath: JERSEY_CLIP }}
        >
          {shortName}
        </div>
        {(pick.is_captain || pick.is_vice_captain) && (
          <span
            className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${
              pick.is_captain ? 'bg-black text-accent' : 'bg-black text-white'
            }`}
          >
            {pick.is_captain ? 'C' : 'V'}
          </span>
        )}
      </div>
      <div className="bg-white text-slate-900 rounded px-2 py-1 mt-1 w-full text-center shadow">
        <div className="text-[11px] font-semibold leading-tight truncate">{player.webName}</div>
        <div className="text-[10px] text-slate-500 leading-tight">{nextFixtureLabel(fixtures, player.teamId, teams)}</div>
      </div>
    </div>
  );
}

function benchLabel(pick: ManagerPick, player: Player): string {
  return pick.position === 12 ? 'GKP' : `${pick.position - 12}. ${positionName(player.elementType)}`;
}

export default function PitchView({
  picks,
  players,
  teams,
  fixtures,
}: {
  picks: ManagerPick[];
  players: Player[];
  teams: Team[];
  fixtures: Fixture[];
}) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const starters = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position > 11).sort((a, b) => a.position - b.position);
  const rows = [1, 2, 3, 4]
    .map((type) => starters.filter((p) => playerById.get(p.element)?.elementType === type))
    .filter((row) => row.length > 0);

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-b from-emerald-700 to-emerald-800 rounded-lg p-4 space-y-6 border border-white/10">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-3 flex-wrap">
            {row.map((pick) => {
              const player = playerById.get(pick.element);
              if (!player) return null;
              return <PlayerChip key={pick.element} pick={pick} player={player} teams={teams} fixtures={fixtures} />;
            })}
          </div>
        ))}
      </div>
      <div className="bg-emerald-900/40 border border-white/10 rounded-lg p-4">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-3 text-center">Substitutes</div>
        <div className="flex justify-center gap-4 flex-wrap">
          {bench.map((pick) => {
            const player = playerById.get(pick.element);
            if (!player) return null;
            return (
              <div key={pick.element} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold">{benchLabel(pick, player)}</span>
                <PlayerChip pick={pick} player={player} teams={teams} fixtures={fixtures} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
