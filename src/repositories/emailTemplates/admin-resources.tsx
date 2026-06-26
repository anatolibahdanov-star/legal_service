import * as React from 'react';
import { Datagrid, EditButton, Edit, TextField, List, SimpleForm, TextInput, BooleanField, BooleanInput, required } from 'react-admin';

const defaultLoading = <p>Загружаем шаблоны писем...</p>

const PLACEHOLDERS_HINT =
    'Плейсхолдеры подставляются автоматически. ' +
    'Пополнение баланса: {name} — имя, {amount} — сумма ₽, {payment_id} — ID платежа, ' +
    '{datetime} — дата и время, {method} — способ оплаты, {balance_questions} — баланс в вопросах, ' +
    '{error} — причина ошибки. ' +
    'Ответ юриста: {user_name} — имя, {question_id} — номер дела, {question_url} — ссылка на ответ. ' +
    'Документы готовы: {user_name} — имя, {question_id} — номер дела, {documents} — список документов, {documents_url} — ссылка на документы. ' +
    'Напоминание об оплате: {user_name} — имя, {question_id} — номер вопроса, {payment_url} — ссылка на пополнение баланса.'

export const EmailTemplateList = () => (
    <List sort={{ field: 'id', order: 'ASC' }} exporter={false} loading={defaultLoading} pagination={false}>
        <Datagrid bulkActionButtons={false} rowClick="edit">
            <TextField source="id" />
            <TextField label="Название" source="name" />
            <TextField label="Тема" source="subject" />
            <TextField label="Код" source="code" />
            <BooleanField label="Отправлять" source="is_active" />
            <EditButton />
        </Datagrid>
    </List>
);

export const EmailTemplateEdit = () => (
    <Edit mutationMode="pessimistic">
        <SimpleForm>
            <TextInput label="Код" source="code" disabled fullWidth />
            <TextInput label="Название" source="name" fullWidth validate={[required()]} />
            <TextInput label="Тема письма" source="subject" fullWidth validate={[required()]} />
            <TextInput
                label="Текст письма"
                source="body"
                multiline
                rows={14}
                fullWidth
                validate={[required()]}
                helperText={PLACEHOLDERS_HINT}
            />
            <TextInput label="Текст кнопки" source="button_label" fullWidth />
            <BooleanInput label="Отправлять письмо" source="is_active" />
        </SimpleForm>
    </Edit>
);
