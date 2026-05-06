
import { DateInput, Filter, Datagrid, EditButton, DeleteButton, Edit, Show, SimpleShowLayout, TextField, List, DateField, SimpleForm, TextInput, SelectInput, PasswordInput, BooleanInput, required, SelectField } from 'react-admin';
import { JSX } from 'react/jsx-runtime';
import { UserStatusesE, UserRegisteredStatusesE } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);
const defaultLoading = <p>Загружаем пользователей...</p>

const UserFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="ФИО" source="name" />
        <TextInput label="E-mail" source="email" />
        <SelectInput label="Статус" source="status" choices={getAdminChoices(UserStatusesE, "Статус пользователя: ", true)} />
        <SelectInput label="Зарег-н?" source="is_register" choices={getAdminChoices(UserRegisteredStatusesE, "Статус регистрации пользователя: ", true)} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

export const UserList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<UserFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField label="ФИО" source="name" />
            <TextField label="E-mail" source="email" />
            <SelectField label="Зарег-н?" source='is_register' choices={getAdminChoices(UserRegisteredStatusesE, "Статус регистрации пользователя: ")} optionValue={'is_register'} />
            <SelectField label="Статус" source='status' choices={getAdminChoices(UserStatusesE, "Статус пользователя: ")} optionValue={'status'} />
            <DateField label="Дата" source='created_at' locales="ru-RU" showTime/>
            <EditButton />
            <DeleteButton />
        </Datagrid>
    </List>
);

export const UserEdit = () => (
    <Edit>
        <SimpleForm>
            <TextInput label="ФИО" source="name" validate={[required()]} />
            <TextInput label="E-mail" source="email" validate={[required()]} />
            <TextInput source="user_id" style={{ display: 'none' }} />
            <SelectInput label="Статус" source="status" choices={getAdminChoices(UserStatusesE, "Статус пользователя: ", true)} />
        </SimpleForm>
    </Edit>
);

export const UserShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField label="ФИО" source="name" />
            <TextField label="E-mail" source="email" />
            <SelectField label="Зарег-н?" source='is_register' choices={getAdminChoices(UserRegisteredStatusesE, "Статус регистрации пользователя: ")} optionValue={'is_register'} />
            <SelectField label="Статус" source='status' choices={getAdminChoices(UserStatusesE, "Статус пользователя: ")} optionValue={'status'} />
            <DateField label="Дата рег-ции" source="created_at" showTime/>
        </SimpleShowLayout>
    </Show>
);