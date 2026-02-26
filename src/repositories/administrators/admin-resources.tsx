import * as React from 'react';
import { DateInput, Filter, Datagrid, EditButton, DeleteButton, Edit, Show, SimpleShowLayout, TextField, List, DateField, Create, SimpleForm, TextInput, SelectInput, PasswordInput, BooleanInput, required, SelectField } from 'react-admin';
import { JSX } from 'react/jsx-runtime';

const AdministratorStatuses = [
    { id: 0, name: 'Disabled' },
    { id: 1, name: 'Active' },
    { id: 2, name: 'Blocked' },
]

const AdministratorSuperStatuses = [
    { id: 0, name: 'Юрист' },
    { id: 1, name: 'Администртор' },
]

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);
const defaultLoading = <p>Загружаем администраторов и юристов...</p>

const AdminFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="Пользователь" source="username" />
        <TextInput label="Имя" source="name" />
        <SelectInput label="Статус" source="status" choices={AdministratorStatuses} />
        <SelectInput label="Роль" source="is_super" choices={AdministratorSuperStatuses} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

export const AdministratorList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<AdminFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField source="name" />
            <TextField source="username" />
            <TextField source="email" />
            <SelectField source='is_super' choices={AdministratorSuperStatuses} optionValue={'is_super'} />
            <SelectField source='status' choices={AdministratorStatuses} optionValue={'status'} />
            <DateField source='created_at' locales="ru-RU" />
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);

export const AdministratorCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput source="name" validate={[required()]} />
            <TextInput source="email" validate={[required()]} />
            <TextInput source="username" validate={[required()]} />
            <TextInput source="user_id" style={{ display: 'none' }} />
            <PasswordInput source="password" initiallyVisible validate={[required()]} />
            <BooleanInput source='is_super' />
            <SelectInput source="status" choices={AdministratorStatuses} />
        </SimpleForm>
    </Create>
);

export const AdministratorEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput source="name" validate={[required()]} />
            <TextInput source="email" validate={[required()]} />
            <TextInput source="username" validate={[required()]} />
            <TextInput source="user_id" style={{ display: 'none' }} />
            <PasswordInput source="password" initiallyVisible validate={[required()]} />
            <BooleanInput source='is_super' />
            <SelectInput source="status" choices={AdministratorStatuses} />
        </SimpleForm>
    </Edit>
);

export const AdministratorShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="name" />
            <TextField source="username" />
            <TextField source="email" />
            <SelectField source='is_super' choices={AdministratorSuperStatuses} optionValue={'is_super'} />
            <SelectField source='status' choices={AdministratorStatuses} optionValue={'status'} />
            <DateField label="Created date" source="created_at" />
        </SimpleShowLayout>
    </Show>
);