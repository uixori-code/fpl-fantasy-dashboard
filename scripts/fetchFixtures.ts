import { fplGet } from './lib/fplClient.ts';
import type { Fixture, FixturesData } from '../src/lib/types.ts';

interface RawFixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string | null;
  finished: boolean;
  team_h_score: number | null;
  team_a_score: number | null;
}

export async function fetchFixtures(): Promise<FixturesData> {
  const raw = await fplGet<RawFixture[]>('/fixtures/');

  const fixtures: Fixture[] = raw.map((f) => ({
    id: f.id,
    event: f.event,
    teamH: f.team_h,
    teamA: f.team_a,
    teamHDifficulty: f.team_h_difficulty,
    teamADifficulty: f.team_a_difficulty,
    kickoffTime: f.kickoff_time,
    finished: f.finished,
    teamHScore: f.team_h_score,
    teamAScore: f.team_a_score,
  }));

  return {
    generatedAt: new Date().toISOString(),
    fixtures,
  };
}
