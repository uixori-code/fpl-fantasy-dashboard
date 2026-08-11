const MANAGER_ID_KEY = 'fpl_manager_id';
const LEAGUE_ID_KEY = 'fpl_league_id';
const WATCHLIST_KEY = 'fpl_watchlist';
const DRAFT_BOARD_KEY = 'fpl_draft_board';
const DRAFT_LEAGUE_ID_KEY = 'fpl_draft_league_id';

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

/** Draft board: who's still available, who you took, who someone else took. */
export type DraftPickStatus = 'available' | 'mine' | 'taken';

/** Only non-available players are stored; anything absent is implicitly available. */
export type DraftBoardState = Record<number, 'mine' | 'taken'>;

export function getDraftBoard(): DraftBoardState {
  try {
    const raw = localStorage.getItem(DRAFT_BOARD_KEY);
    return raw ? (JSON.parse(raw) as DraftBoardState) : {};
  } catch {
    return {};
  }
}

function saveDraftBoard(state: DraftBoardState): DraftBoardState {
  localStorage.setItem(DRAFT_BOARD_KEY, JSON.stringify(state));
  return state;
}

export function setDraftPickStatus(playerId: number, status: DraftPickStatus): DraftBoardState {
  const next = { ...getDraftBoard() };
  if (status === 'available') {
    delete next[playerId];
  } else {
    next[playerId] = status;
  }
  return saveDraftBoard(next);
}

/** Click-through order on the board: available -> mine -> taken -> available. */
export function cycleDraftPickStatus(playerId: number): DraftBoardState {
  const current = getDraftBoard()[playerId];
  const next: DraftPickStatus = current === undefined ? 'mine' : current === 'mine' ? 'taken' : 'available';
  return setDraftPickStatus(playerId, next);
}

/** Bulk-mark players as taken by others (used by optional Draft league sync). */
export function markTakenByOthers(playerIds: number[]): DraftBoardState {
  const next = { ...getDraftBoard() };
  for (const id of playerIds) {
    // Never clobber your own picks — you know those better than the sync does.
    if (next[id] !== 'mine') next[id] = 'taken';
  }
  return saveDraftBoard(next);
}

export function resetDraftBoard(): DraftBoardState {
  localStorage.removeItem(DRAFT_BOARD_KEY);
  return {};
}

export function getDraftLeagueId(): string | null {
  return localStorage.getItem(DRAFT_LEAGUE_ID_KEY);
}

export function setDraftLeagueId(id: string): void {
  localStorage.setItem(DRAFT_LEAGUE_ID_KEY, id);
}

export function clearDraftLeagueId(): void {
  localStorage.removeItem(DRAFT_LEAGUE_ID_KEY);
}
