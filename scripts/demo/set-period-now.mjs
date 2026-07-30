import { demo, requireUserId, printSub } from './_lib.mjs';

const userId = requireUserId('set-period-now.mjs');
console.log('=== ДЕМО: перевод подписки на текущую дату (срок действия истёк «сейчас») ===');

const res = await demo('arm-expire', userId);
if (!res.affected) {
  console.error('✗ Активная подписка не найдена.');
  process.exit(1);
}

const sub = (await demo('status', userId)).subscription;
printSub('Состояние', sub);
console.log('✓ Срок подписки установлен в «сейчас». Теперь запустите expire.mjs — подписка будет закрыта.');
