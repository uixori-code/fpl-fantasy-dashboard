import type { Player, Team } from './types';

export function formatCost(nowCost: number): string {
  return `£${(nowCost / 10).toFixed(1)}m`;
}

export function positionName(elementType: Player['elementType']): string {
  switch (elementType) {
    case 1:
      return 'GKP';
    case 2:
      return 'DEF';
    case 3:
      return 'MID';
    case 4:
      return 'FWD';
  }
}

export function teamShortName(teams: Team[], teamId: number): string {
  return teams.find((t) => t.id === teamId)?.shortName ?? '?';
}

export function playerName(players: Player[], playerId: number): string {
  return players.find((p) => p.id === playerId)?.webName ?? `#${playerId}`;
}

export function difficultyColor(difficulty: number): string {
  switch (difficulty) {
    case 1:
      return 'bg-emerald-600';
    case 2:
      return 'bg-emerald-400';
    case 3:
      return 'bg-slate-400';
    case 4:
      return 'bg-rose-400';
    case 5:
      return 'bg-rose-600';
    default:
      return 'bg-slate-300';
  }
}
