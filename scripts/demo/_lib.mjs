import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function readEnvFile() {
  const env = {};
  try {
    for (const line of readFileSync(join(root, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {}
  return env;
}

const fileEnv = readEnvFile();
export const BASE_URL = process.env.BASE_URL || fileEnv.DEMO_BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.DEMO_SECRET || fileEnv.DEMO_SECRET;

export async function demo(action, userId) {
  if (!TOKEN) {
    console.error('DEMO_SECRET не задан — добавьте его в .env проекта или окружение.');
    process.exit(1);
  }
  let res;
  try {
    res = await fetch(`${BASE_URL}/api/subscriptions/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-demo-token': TOKEN },
      body: JSON.stringify({ action, userId }),
    });
  } catch (e) {
    console.error(`✗ Сервер недоступен (${BASE_URL}): ${e.cause?.code || e.message}`);
    process.exit(1);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    console.error(`✗ ${action}: ${data.message || 'HTTP ' + res.status}`);
    process.exit(1);
  }
  return data;
}

export function requireUserId(scriptName) {
  const id = Number(process.argv[2]);
  if (!id) {
    console.error(`Использование: node scripts/demo/${scriptName} <user_id>`);
    process.exit(1);
  }
  return id;
}

export const fmtDate = (v) => (v ? new Date(v).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function printSub(label, sub) {
  if (!sub) {
    console.log(`${label}: активной подписки нет`);
    return;
  }
  console.log(
    `${label}: период до ${fmtDate(sub.periodEnd)} · след. списание ${fmtDate(sub.nextChargeAt)} · вопросы ${sub.questionsRemaining}/${sub.questionsTotal} · карта ${sub.hasBinding ? 'привязана' : 'не привязана'}`,
  );
}
