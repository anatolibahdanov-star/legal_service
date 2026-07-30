import { demo, requireUserId, printSub } from './_lib.mjs';

const userId = requireUserId('recharge-fail.mjs');
console.log('=== ДЕМО 3: неуспешное автопродление (банк отклонил списание) ===');

const before = (await demo('status', userId)).subscription;
if (!before) {
  console.error('✗ У пользователя нет активной подписки — сначала купите её на сайте.');
  process.exit(1);
}
printSub('До', before);

if (before.hasBinding) {
  await demo('unbind', userId);
  console.log('Связка карты деактивирована на стороне банка — симуляция «карта недоступна».');
}

await demo('arm-renew', userId);
const tick = await demo('renew-tick');
console.log(`Попытка автосписания: успешных ${tick.renewed}, неуспешных ${tick.failed} — банк отклонил платёж.`);

await demo('arm-expire', userId);
const expire = await demo('expire-tick');
console.log(`Подписка закрыта по неоплате: ${expire.expiredSubscriptions} шт.`);

const after = (await demo('status', userId)).subscription;
if (!after) {
  console.log('✓ Оплата не прошла, подписка удалена у пользователя, но осталась в его истории (личный кабинет и админка). Пользователь может оформить подписку заново в любой момент.');
} else {
  printSub('После', after);
  process.exit(1);
}
