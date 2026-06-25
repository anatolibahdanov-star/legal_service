import pool from '@/src/libs/db';
import logger from '@/src/libs/logger';
import { RowDataPacket } from 'mysql2/promise';

const TTL_MS = 60 * 1000;

interface SettingsCache {
  map: Map<string, string>;
  loadedAt: number;
  inFlight: Promise<void> | null;
}

declare global {
  var __settingsCache__: SettingsCache | undefined;
}

const cache: SettingsCache =
  globalThis.__settingsCache__ ??
  (globalThis.__settingsCache__ = { map: new Map(), loadedAt: 0, inFlight: null });

interface SettingValueRow extends RowDataPacket {
  code: string;
  value: string;
}

async function doLoad(): Promise<void> {
  try {
    const [rows] = await pool.query<SettingValueRow[]>(
      'SELECT code, value FROM setting WHERE is_active = 1'
    );
    const next = new Map<string, string>();
    for (const r of rows) next.set(r.code, r.value);
    cache.map = next;
  } catch (err) {
    logger.error('SERVICE SETTINGS doLoad - failed', (err as Error).message);
  } finally {
    cache.loadedAt = Date.now();
  }
}

export function reloadSettings(force = false): Promise<void> {
  const start = (): Promise<void> => {
    const p = doLoad().finally(() => {
      if (cache.inFlight === p) cache.inFlight = null;
    });
    cache.inFlight = p;
    return p;
  };
  if (cache.inFlight) {
    return force ? cache.inFlight.then(start, start) : cache.inFlight;
  }
  return start();
}

export async function warmSettings(): Promise<void> {
  await reloadSettings(true);
}

export function invalidateSettings(): void {
  void reloadSettings(true);
}

function getRaw(code: string): string | undefined {
  if (Date.now() - cache.loadedAt > TTL_MS && !cache.inFlight) {
    void reloadSettings();
  }
  return cache.map.get(code);
}

export function getSettingString(code: string, fallback: string): string {
  const v = getRaw(code);
  return v === undefined ? fallback : v;
}

export function getSettingNumber(code: string, fallback: number): number {
  const v = getRaw(code);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function getSettingInt(code: string, fallback: number): number {
  const v = getRaw(code);
  if (v === undefined) return fallback;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : fallback;
}

export function getSettingBool(code: string, fallback: boolean): boolean {
  const v = getRaw(code);
  if (v === undefined) return fallback;
  return v === '1' || v.toLowerCase() === 'true';
}
