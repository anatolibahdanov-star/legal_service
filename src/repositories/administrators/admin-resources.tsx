import * as React from 'react';
import { DateInput, Filter, Datagrid, EditButton, DeleteButton, Edit, Show, SimpleShowLayout, TextField, List, DateField, Create, SimpleForm, TextInput, SelectInput, PasswordInput, BooleanInput, required, SelectField } from 'react-admin';
import { JSX } from 'react/jsx-runtime';
import { UserStatusesE, UserRolesE } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);
const defaultLoading = <p>Загружаем администраторов и юристов...</p>

const AdminFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="Логин" source="username" />
        <TextInput label="Имя" source="name" />
        <SelectInput label="Статус" source="status" choices={getAdminChoices(UserStatusesE, "Статус пользователя: ", true)} />
        <SelectInput label="Роль" source="is_super" choices={getAdminChoices(UserRolesE, "Роль пользователя: ", true)} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

export const AdministratorList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<AdminFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField label="Имя" source="name" />
            <TextField label="Логин" source="username" />
            <TextField label="E-mail" source="email" />
            <SelectField label="Роль" source='is_super' choices={getAdminChoices(UserRolesE, "Роль пользователя: ")} optionValue={'is_super'} />
            <SelectField label="Статус" source='status' choices={getAdminChoices(UserStatusesE, "Статус пользователя: ")} optionValue={'status'} />
            <DateField label="Дата созд-я" source='created_at' locales="ru-RU" showTime/>
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
            <SelectInput source="status" choices={getAdminChoices(UserStatusesE, "Статус пользователя: ", true)} />
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
            <PasswordInput source="new_password" initiallyVisible />
            <BooleanInput source='is_super' />
            <SelectInput source="status" choices={getAdminChoices(UserStatusesE, "Статус пользователя: ", true)} />
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
            <SelectField source='is_super' choices={getAdminChoices(UserRolesE, "Роль пользователя: ")} optionValue={'is_super'} />
            <SelectField source='status' choices={getAdminChoices(UserStatusesE, "Статус пользователя: ")} optionValue={'status'} />
            <DateField label="Created date" source="created_at" showTime/>
        </SimpleShowLayout>
    </Show>
);