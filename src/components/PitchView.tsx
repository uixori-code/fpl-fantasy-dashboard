import type { Player, Team } from '../lib/types';
import type { ManagerPick } from '../lib/fplLiveClient';
import { formatCost, teamShortName } from '../lib/format';

function PlayerChip({ pick, player, teams }: { pick: ManagerPick; player: Player; teams: Team[] }) {
  return (
    <div className="flex flex-col items-center gap-1 w-20">
      <div className="relative w-11 h-11 rounded-full bg-pitch border-2 border-white flex items-center justify-center text-[10px] font-bold">
        {teamShortName(teams, player.teamId)}
        {pick.is_captain && (
          <span className="absolute -top-1 -right-1 bg-accent text-pitch text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            C
          </span>
        )}
        {pick.is_vice_captain && (
          <span className="absolute -top-1 -right-1 bg-white text-pitch text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            V
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium text-center leading-tight">{player.webName}</span>
      <span className="text-[10px] text-slate-300">{formatCost(player.nowCost)}</span>
    </div>
  );
}

export default function PitchView({
  picks,
  players,
  teams,
}: {
  picks: ManagerPick[];
  players: Player[];
  teams: Team[];
}) {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const starters = picks.filter((p) => p.position <= 11);
  const bench = picks.filter((p) => p.position > 11).sort((a, b) => a.position - b.position);
  const rows = [1, 2, 3, 4]
    .map((type) => starters.filter((p) => playerById.get(p.element)?.elementType === type))
    .filter((row) => row.length > 0);

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-b from-emerald-800 to-emerald-700 rounded-lg p-4 space-y-6 border border-white/10">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-center gap-4 flex-wrap">
            {row.map((pick) => {
              const player = playerById.get(pick.element);
              if (!player) return null;
              return <PlayerChip key={pick.element} pick={pick} player={player} teams={teams} />;
            })}
          </div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Bench</div>
        <div className="flex gap-4 flex-wrap">
          {bench.map((pick) => {
            const player = playerById.get(pick.element);
            if (!player) return null;
            return <PlayerChip key={pick.element} pick={pick} player={player} teams={teams} />;
          })}
        </div>
      </div>
    </div>
  );
}
