import { fetchBootstrap } from './fetchBootstrap.ts';
import { fetchFixtures } from './fetchFixtures.ts';
import { computeDerivedStats } from './computeDerivedStats.ts';
import { fetchTopManagerInsights } from './fetchTopManagerInsights.ts';
import { readJsonFile, writeJsonFile } from './lib/dataFiles.ts';
import { writeMetaPatch, hoursSinceLastTopManagerUpdate } from './writeMeta.ts';
import type { BootstrapData } from '../src/lib/types.ts';

const TOP_MANAGER_THROTTLE_HOURS = 20;

async function runCore(): Promise<BootstrapData> {
  console.log('[core] fetching bootstrap-static...');
  const bootstrap = await fetchBootstrap();
  writeJsonFile('bootstrap-static.json', bootstrap);

  console.log('[core] fetching fixtures...');
  const fixtures = await fetchFixtures();
  writeJsonFile('fixtures.json', fixtures);

  console.log('[core] computing derived stats...');
  const derived = computeDerivedStats(bootstrap, fixtures);
  writeJsonFile('derived-stats.json', derived);

  const currentEvent = bootstrap.events.find((e) => e.isCurrent) ?? bootstrap.events.find((e) => e.isNext);
  writeMetaPatch({
    currentEventId: currentEvent?.id ?? null,
    nextDeadlineTime: bootstrap.events.find((e) => e.isNext)?.deadlineTime ?? null,
    lastCoreUpdate: new Date().toISOString(),
  });

  console.log(`[core] done. ${bootstrap.players.length} players, ${fixtures.fixtures.length} fixtures.`);
  return bootstrap;
}

async function runTopManagers(bootstrap?: BootstrapData): Promise<void> {
  const hoursSince = hoursSinceLastTopManagerUpdate();
  if (hoursSince < TOP_MANAGER_THROTTLE_HOURS) {
    console.log(
      `[top-managers] skipped — last run ${hoursSince.toFixed(1)}h ago, throttle is ${TOP_MANAGER_THROTTLE_HOURS}h.`,
    );
    return;
  }

  const data = bootstrap ?? readJsonFile<BootstrapData>('bootstrap-static.json');
  if (!data) {
    console.log('[top-managers] no bootstrap data available (run "core" first); skipping.');
    return;
  }

  console.log('[top-managers] fetching top-50 manager picks from league 314...');
  const insights = await fetchTopManagerInsights(data);
  writeJsonFile('top-managers.json', insights);
  writeMetaPatch({ lastTopManagerUpdate: new Date().toISOString() });
  console.log(`[top-managers] done. sample size ${insights.sampleSize}.`);
}

async function main() {
  const command = process.argv[2] ?? 'all';

  if (command === 'core') {
    await runCore();
  } else if (command === 'top-managers') {
    await runTopManagers();
  } else if (command === 'all') {
    const bootstrap = await runCore();
    await runTopManagers(bootstrap);
  } else {
    console.error(`Unknown command "${command}". Use one of: core | top-managers | all`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
