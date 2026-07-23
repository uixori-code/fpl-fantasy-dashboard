// Direct browser-side calls to the public FPL API for a single manager. This is the
// one place the dashboard talks to fantasy.premierleague.com live rather than reading
// committed JSON, since fetching one manager's data is cheap (3 requests) unlike the
// bulk top-50 scrape which runs server-side in GitHub Actions instead.

const DIRECT_BASE = 'https://fantasy.premierleague.com/api';
// Fallback if the browser blocks the direct cross-origin request (CORS).
const RELAY_BASE = 'https://corsproxy.io/?url=';

export interface ManagerEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  current_event: number;
}

export interface ManagerHistoryEntry {
  event: number;
  points: number;
  total_points: number;
  overall_rank: number;
  rank: number | null;
  event_transfers: number;
  points_on_bench: number;
}

export interface ManagerHistoryResponse {
  current: ManagerHistoryEntry[];
}

export interface ManagerPick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface ManagerPicksResponse {
  active_chip: string | null;
  entry_history: { points: number; event_transfers_cost: number };
  picks: ManagerPick[];
}

async function fetchWithFallback<T>(path: string): Promise<T> {
  const direct = `${DIRECT_BASE}${path}`;

  try {
    const res = await fetch(direct, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as T;
  } catch {
    const res = await fetch(`${RELAY_BASE}${encodeURIComponent(direct)}`);
    if (!res.ok) throw new Error(`Manager data request failed (direct and relay): ${path}`);
    return (await res.json()) as T;
  }
}

export const fetchManagerEntry = (managerId: string) => fetchWithFallback<ManagerEntry>(`/entry/${managerId}/`);

export const fetchManagerHistory = (managerId: string) =>
  fetchWithFallback<ManagerHistoryResponse>(`/entry/${managerId}/history/`);

export const fetchManagerPicks = (managerId: string, eventId: number) =>
  fetchWithFallback<ManagerPicksResponse>(`/entry/${managerId}/event/${eventId}/picks/`);
