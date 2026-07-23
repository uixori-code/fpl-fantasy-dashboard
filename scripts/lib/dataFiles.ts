import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const DATA_DIR = join(process.cwd(), 'public', 'data');

export function readJsonFile<T>(filename: string): T | null {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

export function writeJsonFile(filename: string, data: unknown): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const path = join(DATA_DIR, filename);
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}
