import * as React from 'react';
import {
    Datagrid, Edit, Create, List, SimpleForm, TextField, BooleanField, DateField, FunctionField,
    TextInput, NumberInput, BooleanInput, SelectInput, useRecordContext, required, minValue,
} from 'react-admin';

const defaultLoading = <p>Загружаем настройки...</p>;

const VALUE_TYPE_CHOICES = [
    { id: 'int', name: 'Целое число' },
    { id: 'decimal', name: 'Число (дробное)' },
    { id: 'bool', name: 'Переключатель (вкл/выкл)' },
    { id: 'string', name: 'Строка' },
    { id: 'text', name: 'Текст (многострочный)' },
];

const formatActor = (record: { admin_name?: string | null; admin_username?: string | null }): string => {
    if (!record.admin_name) return '—';
    return record.admin_username ? `${record.admin_name} (${record.admin_username})` : record.admin_name;
};

const SettingValueInput = () => {
    const record = useRecordContext();
    if (!record) return null;
    const help = (record.description as string) || '';
    switch (record.value_type) {
        case 'bool':
            return (
                <BooleanInput
                    label="Значение"
                    source="value"
                    format={(v) => v === '1' || v === true}
                    parse={(v) => (v ? '1' : '0')}
                    helperText={help}
                />
            );
        case 'int':
            return <NumberInput label="Значение" source="value" min={0} step={1} validate={[required(), minValue(0)]} helperText={help} />;
        case 'decimal':
            return <NumberInput label="Значение" source="value" min={0} step={0.01} validate={[required(), minValue(0)]} helperText={help} />;
        case 'text':
            return <TextInput label="Значение" source="value" multiline rows={8} fullWidth validate={[required()]} helperText={help} />;
        default:
            return <TextInput label="Значение" source="value" fullWidth validate={[required()]} helperText={help} />;
    }
};

export const SettingsList = () => (
    <List sort={{ field: 'weight', order: 'ASC' }} exporter={false} loading={defaultLoading} pagination={false} perPage={200}>
        <Datagrid bulkActionButtons={false} rowClick="edit">
            <TextField label="Группа" source="grp" />
            <TextField label="Параметр" source="name" />
            <TextField label="Значение" source="value" />
            <TextField label="Код" source="code" />
            <BooleanField label="Активен" source="is_active" looseValue />
        </Datagrid>
    </List>
);

export const SettingsEdit = () => (
    <Edit mutationMode="pessimistic">
        <SimpleForm>
            <TextInput label="Параметр" source="name" disabled fullWidth />
            <TextInput label="Код" source="code" disabled fullWidth />
            <SettingValueInput />
            <BooleanInput
                label="Параметр активен (иначе берётся значение по умолчанию из кода)"
                source="is_active"
                format={(v) => v === 1 || v === true}
                parse={(v) => (v ? 1 : 0)}
            />
        </SimpleForm>
    </Edit>
);

export const SettingsCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput label="Код (латиницей, уникальный)" source="code" fullWidth validate={[required()]} />
            <TextInput label="Название" source="name" fullWidth validate={[required()]} />
            <TextInput label="Описание / подсказка" source="description" fullWidth multiline rows={2} />
            <SelectInput label="Тип значения" source="value_type" choices={VALUE_TYPE_CHOICES} defaultValue="int" validate={[required()]} />
            <TextInput label="Значение" source="value" fullWidth validate={[required()]} />
            <TextInput label="Группа" source="grp" defaultValue="general" />
            <NumberInput label="Порядок (вес)" source="weight" defaultValue={0} />
            <BooleanInput label="Активен" source="is_active" defaultValue={true} />
        </SimpleForm>
    </Create>
);

export const PromptVersionList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} exporter={false}>
        <Datagrid bulkActionButtons={false} rowClick="edit">
            <TextField source="id" />
            <TextField label="Название" source="name" />
            <TextField label="Код" source="code" />
            <BooleanField label="Активна" source="is_active" looseValue />
            <FunctionField label="Автор" render={formatActor} />
            <DateField label="Создана" source="created_at" showTime />
        </Datagrid>
    </List>
);

export const PromptVersionCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput label="Код промпта" source="code" defaultValue="grok_answer" fullWidth validate={[required()]} />
            <TextInput label="Название версии" source="name" fullWidth helperText="Например: «Версия 8.2 — уточнили формат ответа»" />
            <TextInput label="Текст промпта" source="body" multiline rows={20} fullWidth validate={[required()]} />
            <BooleanInput label="Сделать активной сразу" source="is_active" defaultValue={true} />
        </SimpleForm>
    </Create>
);

export const PromptVersionEdit = () => (
    <Edit mutationMode="pessimistic">
        <SimpleForm>
            <TextInput label="Код" source="code" disabled fullWidth />
            <TextInput label="Название" source="name" fullWidth validate={[required()]} />
            <TextInput
                label="Текст промпта"
                source="body"
                multiline
                rows={20}
                fullWidth
                validate={[required()]}
                helperText="Изменения применяются к ответам ИИ сразу после сохранения (для активной версии)."
            />
            <BooleanInput
                label="Активная версия"
                source="is_active"
                format={(v) => v === 1 || v === true}
                parse={(v) => (v ? 1 : 0)}
            />
        </SimpleForm>
    </Edit>
);

export const SettingAuditList = () => (
    <List sort={{ field: 'created_at', order: 'DESC' }} exporter={false} pagination={false} perPage={500}>
        <Datagrid bulkActionButtons={false} rowClick={false}>
            <DateField label="Когда" source="created_at" showTime />
            <TextField label="Параметр" source="setting_code" />
            <TextField label="Было" source="old_value" />
            <TextField label="Стало" source="new_value" />
            <FunctionField label="Кто изменил" render={formatActor} />
        </Datagrid>
    </List>
);
