// Shared data shapes written by scripts/ into public/data/*.json and read by the frontend.

export type PlayerStatus = 'a' | 'd' | 'i' | 's' | 'u' | 'n';

export interface Player {
  id: number;
  webName: string;
  firstName: string;
  secondName: string;
  teamId: number;
  elementType: 1 | 2 | 3 | 4; // 1 GKP, 2 DEF, 3 MID, 4 FWD
  nowCost: number; // tenths of a million, e.g. 55 = £5.5m
  costChangeEvent: number;
  costChangeStart: number;
  form: number;
  totalPoints: number;
  pointsPerGame: number;
  selectedByPercent: number;
  transfersInEvent: number;
  transfersOutEvent: number;
  status: PlayerStatus;
  news: string;
  minutes: number;
  ictIndex: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  strength: number;
}

export interface GameweekEvent {
  id: number;
  name: string;
  deadlineTime: string;
  isCurrent: boolean;
  isNext: boolean;
  finished: boolean;
  averageEntryScore: number;
  highestScore: number | null;
}

export interface BootstrapData {
  generatedAt: string;
  players: Player[];
  teams: Team[];
  events: GameweekEvent[];
}

export interface Fixture {
  id: number;
  event: number | null;
  teamH: number;
  teamA: number;
  teamHDifficulty: number;
  teamADifficulty: number;
  kickoffTime: string | null;
  finished: boolean;
  teamHScore: number | null;
  teamAScore: number | null;
}

export interface FixturesData {
  generatedAt: string;
  fixtures: Fixture[];
}

export interface RankedPlayer {
  playerId: number;
  value: number;
}

export interface FixtureRun {
  teamId: number;
  avgDifficultyNext5: number;
  nextDifficulties: number[];
}

export interface CaptaincySuggestion {
  playerId: number;
  score: number;
  reason: string;
}

export interface DerivedStats {
  generatedAt: string;
  currentEventId: number | null;
  topScorers: RankedPlayer[];
  mostTransferredIn: RankedPlayer[];
  mostTransferredOut: RankedPlayer[];
  priceRisers: RankedPlayer[];
  priceFallers: RankedPlayer[];
  ownershipLeaders: RankedPlayer[];
  formLeaders: RankedPlayer[];
  valuePicks: RankedPlayer[];
  differentials: RankedPlayer[];
  fixtureRuns: FixtureRun[];
  captaincySuggestions: CaptaincySuggestion[];
}

export interface OwnedCount {
  playerId: number;
  count: number;
  percent: number;
}

export interface FormationCount {
  formation: string;
  count: number;
}

export interface ChipUsageCount {
  chip: string;
  count: number;
}

export interface TopManagersData {
  generatedAt: string | null;
  leagueId: 314;
  eventId: number | null;
  sampleSize: number;
  mostOwnedAmongTop: OwnedCount[];
  mostCaptained: OwnedCount[];
  formationCounts: FormationCount[];
  chipUsage: ChipUsageCount[];
}

export interface Meta {
  schemaVersion: 1;
  currentEventId: number | null;
  nextDeadlineTime: string | null;
  lastCoreUpdate: string | null;
  lastTopManagerUpdate: string | null;
}
