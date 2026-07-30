import { demo, requireUserId, printSub, fmtDate } from './_lib.mjs';

const userId = requireUserId('recharge.mjs');
console.log('=== ДЕМО 1: автоматическое продление подписки (речардж) ===');

const before = (await demo('status', userId)).subscription;
if (!before) {
  console.error('✗ У пользователя нет активной подписки — сначала купите её на сайте.');
  process.exit(1);
}
printSub('До', before);

await demo('arm-renew', userId);
console.log('Дата списания подведена к текущему моменту. Запускаем цикл автопродления…');

const tick = await demo('renew-tick');
console.log(`Цикл выполнен: успешных списаний ${tick.renewed}, неуспешных ${tick.failed}.`);

const after = (await demo('status', userId)).subscription;
printSub('После', after);

const extended = after && new Date(after.periodEnd) > new Date(before.periodEnd);
if (extended) {
  console.log(`✓ Деньги списаны с привязанной карты без участия пользователя. Период продлён до ${fmtDate(after.periodEnd)}, месячный лимит вопросов добавлен к остатку.`);
} else {
  console.log('✗ Продление этого пользователя не прошло — детали в логах сервера.');
  process.exit(1);
}
