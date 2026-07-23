import { fplGet } from './lib/fplClient.ts';
import type { BootstrapData, Player, PlayerStatus, Team, GameweekEvent } from '../src/lib/types.ts';

interface RawElement {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  team: number;
  element_type: 1 | 2 | 3 | 4;
  now_cost: number;
  cost_change_event: number;
  cost_change_start: number;
  form: string;
  total_points: number;
  points_per_game: string;
  selected_by_percent: string;
  transfers_in_event: number;
  transfers_out_event: number;
  status: PlayerStatus;
  news: string;
  minutes: number;
  ict_index: string;
}

interface RawTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
}

interface RawEvent {
  id: number;
  name: string;
  deadline_time: string;
  is_current: boolean;
  is_next: boolean;
  finished: boolean;
  average_entry_score: number;
  highest_score: number | null;
}

interface RawBootstrap {
  elements: RawElement[];
  teams: RawTeam[];
  events: RawEvent[];
}

export async function fetchBootstrap(): Promise<BootstrapData> {
  const raw = await fplGet<RawBootstrap>('/bootstrap-static/');

  const players: Player[] = raw.elements.map((e) => ({
    id: e.id,
    webName: e.web_name,
    firstName: e.first_name,
    secondName: e.second_name,
    teamId: e.team,
    elementType: e.element_type,
    nowCost: e.now_cost,
    costChangeEvent: e.cost_change_event,
    costChangeStart: e.cost_change_start,
    form: Number(e.form) || 0,
    totalPoints: e.total_points,
    pointsPerGame: Number(e.points_per_game) || 0,
    selectedByPercent: Number(e.selected_by_percent) || 0,
    transfersInEvent: e.transfers_in_event,
    transfersOutEvent: e.transfers_out_event,
    status: e.status,
    news: e.news,
    minutes: e.minutes,
    ictIndex: Number(e.ict_index) || 0,
  }));

  const teams: Team[] = raw.teams.map((t) => ({
    id: t.id,
    name: t.name,
    shortName: t.short_name,
    strength: t.strength,
  }));

  const events: GameweekEvent[] = raw.events.map((ev) => ({
    id: ev.id,
    name: ev.name,
    deadlineTime: ev.deadline_time,
    isCurrent: ev.is_current,
    isNext: ev.is_next,
    finished: ev.finished,
    averageEntryScore: ev.average_entry_score,
    highestScore: ev.highest_score,
  }));

  return {
    generatedAt: new Date().toISOString(),
    players,
    teams,
    events,
  };
}
