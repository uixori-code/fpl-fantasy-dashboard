import type { BootstrapData, FixturesData, DerivedStats, TopManagersData, Meta } from './types';

const base = import.meta.env.BASE_URL;

async function loadJson<T>(filename: string): Promise<T> {
  const res = await fetch(`${base}data/${filename}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  return res.json() as Promise<T>;
}

export const loadBootstrap = () => loadJson<BootstrapData>('bootstrap-static.json');
export const loadFixtures = () => loadJson<FixturesData>('fixtures.json');
export const loadDerivedStats = () => loadJson<DerivedStats>('derived-stats.json');
export const loadTopManagers = () => loadJson<TopManagersData>('top-managers.json');
export const loadMeta = () => loadJson<Meta>('meta.json');
