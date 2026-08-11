// Direct browser-side calls to the public FPL API for a single manager. This is the
// one place the dashboard talks to fantasy.premierleague.com live rather than reading
// committed JSON, since fetching one manager's data is cheap (3 requests) unlike the
// bulk top-50 scrape which runs server-side in GitHub Actions instead.

const DIRECT_BASE = 'https://fantasy.premierleague.com/api';
// FPL Draft is a separate game on its own host, with its own player-ownership model.
const DRAFT_BASE = 'https://draft.premierleague.com/api';
// Fallback if the browser blocks the direct cross-origin request (CORS).
const RELAY_BASE = 'https://corsproxy.io/?url=';

export interface ManagerEntry {
  id: number;
  player_first_name: string;
  player_last_name: string;
  name: string;
  summary_overall_points: number | null;
  summary_overall_rank: number | null;
  summary_event_points: number | null;
  current_event: number | null;
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

async function fetchWithFallback<T>(path: string, base: string = DIRECT_BASE): Promise<T> {
  const direct = `${base}${path}`;
  let directReason: string;

  try {
    const res = await fetch(direct, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}${res.status === 404 ? ' Not Found' : ''}`);
    return (await res.json()) as T;
  } catch (err) {
    directReason = err instanceof Error ? err.message : String(err);
  }

  try {
    const res = await fetch(`${RELAY_BASE}${encodeURIComponent(direct)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}${res.status === 404 ? ' Not Found' : ''}`);
    return (await res.json()) as T;
  } catch (err) {
    const relayReason = err instanceof Error ? err.message : String(err);
    throw new Error(`${path} — direct: ${directReason}; relay: ${relayReason}`);
  }
}

export const fetchManagerEntry = (managerId: string) => fetchWithFallback<ManagerEntry>(`/entry/${managerId}/`);

export const fetchManagerHistory = (managerId: string) =>
  fetchWithFallback<ManagerHistoryResponse>(`/entry/${managerId}/history/`);

export const fetchManagerPicks = (managerId: string, eventId: number) =>
  fetchWithFallback<ManagerPicksResponse>(`/entry/${managerId}/event/${eventId}/picks/`);

export interface LeagueStandingEntry {
  entry: number;
  entry_name: string;
  player_name: string;
  rank: number;
  last_rank: number;
  total: number;
  event_total: number;
}

export interface LeagueStandingsResponse {
  league: { id: number; name: string };
  standings: { results: LeagueStandingEntry[]; has_next: boolean };
}

export const fetchLeagueStandings = (leagueId: string) =>
  fetchWithFallback<LeagueStandingsResponse>(`/leagues-classic/${leagueId}/standings/?page_standings=1`);

/**
 * Per-player ownership within an FPL Draft league: who's owned, who's a free agent.
 * `owner` is the league entry id that holds the player, or null if unowned.
 *
 * This endpoint is undocumented and unverified from this environment, so every caller must
 * treat failure as normal and fall back to manual board marking rather than surfacing an error.
 */
export interface DraftElementStatus {
  element: number;
  owner: number | null;
  status: string;
}

export interface DraftElementStatusResponse {
  element_status: DraftElementStatus[];
}

export const fetchDraftElementStatus = (draftLeagueId: string) =>
  fetchWithFallback<DraftElementStatusResponse>(`/league/${draftLeagueId}/element-status`, DRAFT_BASE);
