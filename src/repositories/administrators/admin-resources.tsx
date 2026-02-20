import * as React from 'react';
import { Datagrid, EditButton, DeleteButton, Edit, Show, SimpleShowLayout, TextField, List, DateField, Create, SimpleForm, TextInput, SelectInput, PasswordInput, BooleanInput, required, SelectField } from 'react-admin';

const AdministratorStatuses = [
    { id: 0, name: 'Disabled' },
    { id: 1, name: 'Active' },
    { id: 2, name: 'Blocked' },
]

const AdministratorSuperStatuses = [
    { id: 0, name: 'Content Manager' },
    { id: 1, name: 'Super Admin' },
]

export const AdministratorList = () => (
    <List sort={{ field: 'id', order: 'DESC' }}>
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