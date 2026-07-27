import * as React from 'react';
import {
    Datagrid, Edit, Create, List, SimpleForm, TextField, NumberField, BooleanField,
    TextInput, NumberInput, BooleanInput, SelectInput, required, minValue,
} from 'react-admin';

const defaultLoading = <p>Загружаем тарифы...</p>;

const TONE_CHOICES = [
    { id: 'orange', name: 'Оранжевый' },
    { id: 'yellow', name: 'Жёлтый' },
    { id: 'purple', name: 'Фиолетовый' },
    { id: 'green', name: 'Зелёный' },
];

const integerValidator = (value: unknown): string | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number.isInteger(Number(value)) ? undefined : 'Должно быть целым числом';
};

const priceValidation = [required(), minValue(1, 'Стоимость должна быть больше 0'), integerValidator];
const bvValidation = [required(), minValue(1, 'Количество должно быть больше 0'), integerValidator];

const PlanFormFields = () => (
    <>
        <TextInput label="Название" source="name" fullWidth validate={[required()]} />
        <TextInput label="Описание" source="description" fullWidth multiline rows={2} />
        <NumberInput label="Стоимость, ₽ / мес" source="price_rub" min={1} step={1} validate={priceValidation} />
        <NumberInput label="Кол-во бесплатных вопросов (БВ) / мес" source="bv_amount" min={1} step={1} validate={bvValidation} />
        <SelectInput label="Цвет карточки (лендинг)" source="tone" choices={TONE_CHOICES} emptyText="—" />
        <TextInput label="Бейдж (лендинг)" source="badge" fullWidth />
        <NumberInput label="Порядок вывода (вес)" source="weight" defaultValue={0} step={1} />
        <BooleanInput
            label="Выделить как «Оптимальный»"
            source="featured"
            format={(v) => v === 1 || v === true}
            parse={(v) => (v ? 1 : 0)}
        />
        <BooleanInput
            label="Активен (показывать на сайте). Не более 3 активных тарифов."
            source="is_active"
            format={(v) => v === 1 || v === true}
            parse={(v) => (v ? 1 : 0)}
        />
    </>
);

export const SubscriptionsList = () => (
    <List sort={{ field: 'weight', order: 'ASC' }} exporter={false} loading={defaultLoading} pagination={false} perPage={200}>
        <Datagrid bulkActionButtons={false} rowClick="edit">
            <TextField label="Название" source="name" />
            <NumberField label="Стоимость, ₽" source="price_rub" />
            <NumberField label="БВ / мес" source="bv_amount" />
            <NumberField label="Вес" source="weight" />
            <BooleanField label="Активен" source="is_active" looseValue />
        </Datagrid>
    </List>
);

export const SubscriptionsCreate = () => (
    <Create redirect="list">
        <SimpleForm>
            <PlanFormFields />
        </SimpleForm>
    </Create>
);

export const SubscriptionsEdit = () => (
    <Edit mutationMode="pessimistic">
        <SimpleForm>
            <PlanFormFields />
        </SimpleForm>
    </Edit>
);
