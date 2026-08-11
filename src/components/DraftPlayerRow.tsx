import type { Fixture, Player, Team } from '../lib/types';
import type { DraftPickStatus } from '../lib/storage';
import { nextFixtureLabel, positionName, teamShortName } from '../lib/format';
import { teamColor } from '../lib/teamColors';

const STATUS_STYLES: Record<DraftPickStatus, string> = {
  available: 'bg-white/5 hover:bg-white/10',
  mine: 'bg-accent/15 hover:bg-accent/25',
  taken: 'bg-transparent opacity-40 hover:opacity-60',
};

const STATUS_BADGE: Record<DraftPickStatus, { label: string; className: string } | null> = {
  available: null,
  mine: { label: 'MINE', className: 'bg-accent text-pitch' },
  taken: { label: 'TAKEN', className: 'bg-slate-600 text-slate-200' },
};

export default function DraftPlayerRow({
  player,
  teams,
  fixtures,
  score,
  status,
  tier,
  isBestAvailable,
  onCycle,
}: {
  player: Player;
  teams: Team[];
  fixtures: Fixture[];
  score: number;
  status: DraftPickStatus;
  /** Shown only in the mixed-position list, where tier headers aren't available for context. */
  tier?: number;
  isBestAvailable: boolean;
  onCycle: () => void;
}) {
  const shortName = teamShortName(teams, player.teamId);
  const badge = STATUS_BADGE[status];
  const unavailable = player.status !== 'a';

  return (
    <button
      onClick={onCycle}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${STATUS_STYLES[status]} ${
        isBestAvailable ? 'ring-1 ring-accent' : ''
      }`}
      title={`${player.webName} — click to cycle available / mine / taken`}
    >
      <span
        className="w-1.5 h-8 rounded-sm shrink-0"
        style={{ backgroundColor: teamColor(shortName, player.teamId) }}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`font-medium truncate ${status === 'taken' ? 'line-through' : ''}`}>{player.webName}</span>
          {unavailable && (
            <span
              className="text-[10px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 shrink-0"
              title={player.news || 'Not fully available'}
            >
              {player.status === 'i' ? 'INJ' : player.status === 's' ? 'SUS' : player.status === 'd' ? 'DBT' : 'N/A'}
            </span>
          )}
          {badge && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </span>
        <span className="block text-xs text-slate-400 truncate">
          {shortName} · {positionName(player.elementType)}
          {tier !== undefined ? ` · T${tier}` : ''} · {player.totalPoints} pts ·{' '}
          {nextFixtureLabel(fixtures, player.teamId, teams)}
        </span>
      </span>
      <span className="text-sm font-semibold text-accent shrink-0 tabular-nums">{score}</span>
    </button>
  );
}
