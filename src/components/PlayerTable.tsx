import type { Player, Team } from '../lib/types';
import { formatCost, positionName, teamShortName } from '../lib/format';

interface Row {
  playerId: number;
  value: number;
}

export default function PlayerTable({
  title,
  rows,
  players,
  teams,
  valueLabel,
  formatValue,
}: {
  title: string;
  rows: Row[];
  players: Player[];
  teams: Team[];
  valueLabel: string;
  formatValue?: (v: number) => string;
}) {
  const playerById = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 font-semibold">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-white/10">
            <th className="px-4 py-2 font-medium">Player</th>
            <th className="px-4 py-2 font-medium">Team</th>
            <th className="px-4 py-2 font-medium">Pos</th>
            <th className="px-4 py-2 font-medium">Price</th>
            <th className="px-4 py-2 font-medium text-right">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const player = playerById.get(row.playerId);
            if (!player) return null;
            return (
              <tr key={row.playerId} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                <td className="px-4 py-2 font-medium">{player.webName}</td>
                <td className="px-4 py-2 text-slate-400">{teamShortName(teams, player.teamId)}</td>
                <td className="px-4 py-2 text-slate-400">{positionName(player.elementType)}</td>
                <td className="px-4 py-2 text-slate-400">{formatCost(player.nowCost)}</td>
                <td className="px-4 py-2 text-right font-semibold text-accent">
                  {formatValue ? formatValue(row.value) : row.value}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                No data yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
