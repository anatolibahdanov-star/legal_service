# 25.07.2026

-- Долговечная привязка заказа к тарифу подписки. porder.data перезаписывается
-- при каждом опросе статуса (transaction_info), поэтому planId нельзя хранить
-- только там — иначе многошаговый платёж (Register→Auth) и reconcile продления
-- теряют тариф. Вынесено отдельной миграцией, чтобы ALTER (неидемпотентный)
-- не привязывался к бэкфиллу из 20260724.sql.
ALTER TABLE porder
    ADD COLUMN plan_id INT UNSIGNED NULL DEFAULT NULL,
    ADD CONSTRAINT fk_porder_plan_id
        FOREIGN KEY (plan_id) REFERENCES subscription_plan (id) ON DELETE SET NULL;
