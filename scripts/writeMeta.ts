import { readJsonFile, writeJsonFile } from './lib/dataFiles.ts';
import type { Meta } from '../src/lib/types.ts';

const FILENAME = 'meta.json';

const DEFAULT_META: Meta = {
  schemaVersion: 1,
  currentEventId: null,
  nextDeadlineTime: null,
  lastCoreUpdate: null,
  lastTopManagerUpdate: null,
};

export function readMeta(): Meta {
  return readJsonFile<Meta>(FILENAME) ?? DEFAULT_META;
}

export function writeMetaPatch(patch: Partial<Meta>): Meta {
  const next: Meta = { ...readMeta(), ...patch };
  writeJsonFile(FILENAME, next);
  return next;
}

/** Hours since the top-manager scrape last ran successfully; Infinity if never. */
export function hoursSinceLastTopManagerUpdate(): number {
  const meta = readMeta();
  if (!meta.lastTopManagerUpdate) return Infinity;
  const elapsedMs = Date.now() - new Date(meta.lastTopManagerUpdate).getTime();
  return elapsedMs / (1000 * 60 * 60);
}
