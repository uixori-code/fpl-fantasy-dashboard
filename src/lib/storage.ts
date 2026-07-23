const MANAGER_ID_KEY = 'fpl_manager_id';
const LEAGUE_ID_KEY = 'fpl_league_id';
const WATCHLIST_KEY = 'fpl_watchlist';

export function getManagerId(): string | null {
  return localStorage.getItem(MANAGER_ID_KEY);
}

export function setManagerId(id: string): void {
  localStorage.setItem(MANAGER_ID_KEY, id);
}

export function clearManagerId(): void {
  localStorage.removeItem(MANAGER_ID_KEY);
}

export function getLeagueId(): string | null {
  return localStorage.getItem(LEAGUE_ID_KEY);
}

export function setLeagueId(id: string): void {
  localStorage.setItem(LEAGUE_ID_KEY, id);
}

export function clearLeagueId(): void {
  localStorage.removeItem(LEAGUE_ID_KEY);
}

export function getWatchlist(): number[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

export function isWatchlisted(playerId: number): boolean {
  return getWatchlist().includes(playerId);
}

export function toggleWatchlist(playerId: number): number[] {
  const current = getWatchlist();
  const next = current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId];
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  return next;
}
