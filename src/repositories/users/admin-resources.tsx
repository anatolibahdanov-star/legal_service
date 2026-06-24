import { Edit, Show, SimpleShowLayout, TextField, SimpleForm, TextInput, SelectInput, required, SelectField, DateField } from 'react-admin';
import { UserStatusesE, UserRegisteredStatusesE } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';
import { UsersList } from '@/src/app/components/admin/users/UsersList';

export const UserList = UsersList;

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
