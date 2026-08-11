import { useMemo, useState } from 'react';
import { loadBootstrap, loadDerivedStats, loadFixtures } from '../lib/dataLoader';
import { useAsyncData } from '../lib/useAsyncData';
import {
  getDraftBoard,
  cycleDraftPickStatus,
  resetDraftBoard,
  getDraftLeagueId,
  markTakenByOthers,
  type DraftBoardState,
  type DraftPickStatus,
} from '../lib/storage';
import { fetchDraftElementStatus } from '../lib/fplLiveClient';
import { positionName, teamShortName } from '../lib/format';
import DraftPlayerRow from '../components/DraftPlayerRow';
import type { Player } from '../lib/types';

/** FPL Draft squads are a fixed shape — no budget, so the constraint is purely positional. */
const SQUAD_LIMITS: Record<number, number> = { 1: 2, 2: 5, 3: 5, 4: 3 };
const POSITIONS = [1, 2, 3, 4] as const;
/** Per-position "elite" pool used for the scarcity meter. */
const ELITE_POOL_SIZE = 12;
/** How many players the unfiltered best-available list shows before you filter down. */
const BEST_AVAILABLE_LIMIT = 60;

function statusOf(board: DraftBoardState, playerId: number): DraftPickStatus {
  return board[playerId] ?? 'available';
}

export default function DraftBoard() {
  const [board, setBoard] = useState<DraftBoardState>(getDraftBoard);
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');
  const [hideTaken, setHideTaken] = useState(false);
  const [search, setSearch] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'ok' | 'failed'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const { data, loading, error } = useAsyncData(async () => {
    const [bootstrap, derived, fixtures] = await Promise.all([loadBootstrap(), loadDerivedStats(), loadFixtures()]);
    return { bootstrap, derived, fixtures };
  });

  const playerById = useMemo(
    () => new Map((data?.bootstrap.players ?? []).map((p) => [p.id, p])),
    [data],
  );
  const scoreById = useMemo(
    () => new Map((data?.derived.draftRanks ?? []).map((r) => [r.playerId, r.value])),
    [data],
  );

  if (loading) return <p className="text-slate-400">Loading draft board…</p>;
  if (error || !data) return <p className="text-rose-400">Couldn't load data: {error}</p>;

  const { bootstrap, derived, fixtures } = data;
  const tiers = derived.draftTiers ?? [];

  const myPicks = Object.entries(board)
    .filter(([, s]) => s === 'mine')
    .map(([id]) => playerById.get(Number(id)))
    .filter((p): p is Player => !!p);

  const countByPosition = (elementType: number) => myPicks.filter((p) => p.elementType === elementType).length;

  // Scarcity: how much of each position's elite pool is still on the board. Uses a fixed
  // top-N by draft rank rather than "top N tiers" — tier sizes vary wildly (a tier can be a
  // single player), which made cross-position comparison meaningless.
  const scarcity = POSITIONS.map((elementType) => {
    const elite = (derived.draftRanks ?? [])
      .filter((r) => playerById.get(r.playerId)?.elementType === elementType)
      .slice(0, ELITE_POOL_SIZE);
    const remaining = elite.filter((r) => statusOf(board, r.playerId) === 'available').length;
    return { elementType, remaining, total: elite.length };
  });

  const matchesFilters = (p: Player) =>
    (hideTaken ? statusOf(board, p.id) !== 'taken' : true) &&
    (search ? p.webName.toLowerCase().includes(search.toLowerCase()) : true);

  // Unfiltered, the board is a single best-available list — opening on a position-sorted view
  // buries the elite outfielders behind every goalkeeper. Tiers only group once you filter to
  // a position, which is where "these are interchangeable" is actually the useful question.
  const tierByPlayerId = new Map<number, number>();
  for (const t of tiers) for (const id of t.playerIds) tierByPlayerId.set(id, t.tier);

  const bestAvailable: Player[] =
    positionFilter === 'all'
      ? (derived.draftRanks ?? [])
          .map((r) => playerById.get(r.playerId))
          .filter((p): p is Player => !!p)
          .filter(matchesFilters)
          .slice(0, BEST_AVAILABLE_LIMIT)
      : [];

  const visibleTiers =
    positionFilter === 'all'
      ? []
      : tiers
          .filter((t) => t.elementType === positionFilter)
          .map((t) => ({
            ...t,
            players: t.playerIds
              .map((id) => playerById.get(id))
              .filter((p): p is Player => !!p)
              .filter(matchesFilters),
          }))
          .filter((t) => t.players.length > 0)
          .sort((a, b) => a.tier - b.tier);

  const bestAvailableId = (derived.draftRanks ?? []).find((r) => statusOf(board, r.playerId) === 'available')?.playerId;

  async function handleSync() {
    const draftLeagueId = getDraftLeagueId();
    if (!draftLeagueId) {
      setSyncState('failed');
      setSyncMessage('No Draft league ID saved yet — add one in Settings to enable auto-sync.');
      return;
    }
    setSyncState('syncing');
    setSyncMessage('Checking your Draft league…');
    try {
      const res = await fetchDraftElementStatus(draftLeagueId);
      const ownedIds = res.element_status.filter((e) => e.owner != null).map((e) => e.element);
      setBoard(markTakenByOthers(ownedIds));
      setSyncState('ok');
      setSyncMessage(`Synced — ${ownedIds.length} players already owned in your league.`);
    } catch (err) {
      setSyncState('failed');
      setSyncMessage(
        `Auto-sync unavailable (${err instanceof Error ? err.message : String(err)}). The board still works — just mark picks yourself.`,
      );
    }
  }

  function handleReset() {
    setBoard(resetDraftBoard());
    setSyncState('idle');
    setSyncMessage('');
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              <button
                onClick={() => setPositionFilter('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  positionFilter === 'all' ? 'bg-accent text-pitch' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                All
              </button>
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPositionFilter(pos)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    positionFilter === pos ? 'bg-accent text-pitch' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {positionName(pos)}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search player…"
              className="flex-1 min-w-[140px] bg-white/5 border border-white/20 rounded-md px-3 py-1.5 text-sm outline-none focus:border-accent"
            />
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={hideTaken} onChange={(e) => setHideTaken(e.target.checked)} />
              Hide taken
            </label>
          </div>

          {positionFilter === 'all' && bestAvailable.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-300">Best Available</span>
                <span className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-slate-500">Filter by position for tiers</span>
              </div>
              <div className="space-y-1">
                {bestAvailable.map((player) => (
                  <DraftPlayerRow
                    key={player.id}
                    player={player}
                    teams={bootstrap.teams}
                    fixtures={fixtures.fixtures}
                    score={scoreById.get(player.id) ?? 0}
                    status={statusOf(board, player.id)}
                    tier={tierByPlayerId.get(player.id)}
                    isBestAvailable={player.id === bestAvailableId}
                    onCycle={() => setBoard(cycleDraftPickStatus(player.id))}
                  />
                ))}
              </div>
            </div>
          )}

          {visibleTiers.map((tier) => (
            <div key={`${tier.elementType}-${tier.tier}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-300">
                  {positionName(tier.elementType as Player['elementType'])} · Tier {tier.tier}
                </span>
                <span className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-1">
                {tier.players.map((player) => (
                  <DraftPlayerRow
                    key={player.id}
                    player={player}
                    teams={bootstrap.teams}
                    fixtures={fixtures.fixtures}
                    score={scoreById.get(player.id) ?? 0}
                    status={statusOf(board, player.id)}
                    isBestAvailable={player.id === bestAvailableId}
                    onCycle={() => setBoard(cycleDraftPickStatus(player.id))}
                  />
                ))}
              </div>
            </div>
          ))}

          {visibleTiers.length === 0 && bestAvailable.length === 0 && (
            <div className="bg-white/5 border border-dashed border-white/20 rounded-lg p-8 text-center text-slate-400">
              {tiers.length === 0
                ? 'Draft rankings will appear after the next hourly data refresh.'
                : 'No players match these filters.'}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-semibold">My Squad</span>
              <span className="text-sm text-slate-400">{myPicks.length}/15</span>
            </div>
            <div className="space-y-3">
              {POSITIONS.map((pos) => {
                const picked = myPicks.filter((p) => p.elementType === pos);
                const limit = SQUAD_LIMITS[pos];
                return (
                  <div key={pos}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold">{positionName(pos)}</span>
                      <span
                        className={
                          countByPosition(pos) > limit
                            ? 'text-rose-400 font-semibold'
                            : countByPosition(pos) === limit
                              ? 'text-accent'
                              : ''
                        }
                        title={countByPosition(pos) > limit ? 'Over the FPL Draft squad limit' : undefined}
                      >
                        {countByPosition(pos)}/{limit}
                        {countByPosition(pos) > limit ? ' ⚠' : ''}
                      </span>
                    </div>
                    {picked.length > 0 ? (
                      <ul className="space-y-0.5">
                        {picked.map((p) => (
                          <li key={p.id} className="text-sm flex justify-between">
                            <span className="truncate">{p.webName}</span>
                            <span className="text-slate-500 shrink-0 ml-2">
                              {teamShortName(bootstrap.teams, p.teamId)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-600">None yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="font-semibold mb-2">Positional Scarcity</div>
            <p className="text-xs text-slate-500 mb-3">
              Top {ELITE_POOL_SIZE} per position still on the board — when one runs dry, reach early.
            </p>
            <div className="space-y-2">
              {scarcity.map((s) => (
                <div key={s.elementType} className="flex items-center gap-2 text-sm">
                  <span className="w-10 font-semibold">{positionName(s.elementType)}</span>
                  <span className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
                    <span
                      className={`block h-full ${s.remaining <= 2 ? 'bg-rose-500' : 'bg-accent'}`}
                      style={{ width: s.total ? `${(s.remaining / s.total) * 100}%` : '0%' }}
                    />
                  </span>
                  <span className={`tabular-nums text-xs ${s.remaining <= 2 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {s.remaining}/{s.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2">
            <div className="font-semibold">Board Controls</div>
            <p className="text-xs text-slate-500">
              Click any player to cycle: available → mine → taken. Saved in this browser only.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleSync}
                disabled={syncState === 'syncing'}
                className="flex-1 px-3 py-1.5 rounded-md text-sm border border-white/20 hover:bg-white/10 disabled:opacity-50"
              >
                {syncState === 'syncing' ? 'Syncing…' : 'Sync league'}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-md text-sm border border-white/20 hover:bg-white/10"
              >
                Reset
              </button>
            </div>
            {syncMessage && (
              <p className={`text-xs ${syncState === 'failed' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {syncMessage}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
