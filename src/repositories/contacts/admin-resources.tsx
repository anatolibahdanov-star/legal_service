import { DeleteButton, SimpleShowLayout, Show, DateInput, Filter, Datagrid, TextField, List, DateField, TextInput, SelectInput, SelectField } from 'react-admin';
import { JSX } from 'react/jsx-runtime';
import { EmailStatusesE } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);
const defaultLoading = <p>Загружаем заявки из формы контактов...</p>

const ContactFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="E-mail" source="email" />
        <TextInput label="Телефон" source="phone" />
        <TextInput label="Сообщение" source="message" />
        <TextInput label="Пользователь" source="user_name" />
        <SelectInput label="E-mail статус" source="email_status" choices={getAdminChoices(EmailStatusesE, "Статус платежа: ", true)} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

export const ContactList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<ContactFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField label="E-mail" source="email" />
            <TextField label="Телефон" source="phone" />
            <TextField label="Пользователь" source="user_name" />
            <TextField label="Сообщение" source="message" />
            <SelectField label="E-mail статус" source='email_status' choices={getAdminChoices(EmailStatusesE, "Статус отправки email-а: ")} optionValue={'email_status'} />
            <DateField label="Дата" source='created_at' locales="ru-RU" showTime />
            <DeleteButton /> 
        </Datagrid>
    </List>
);

export const ContactShow = () => (
    <Show>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField label="E-mail" source="email" />
            <TextField label="Телефон" source="phone" />
            <TextField label="Пользователь" source="user_name" />
            <TextField label="Сообщение" source="message" />
            <SelectField label="E-mail статус" source='email_status' choices={getAdminChoices(EmailStatusesE, "Статус отправки email-а: ")} optionValue={'email_status'} />
            <DateField label="Дата" source='created_at' locales="ru-RU" showTime />
        </SimpleShowLayout>
    </Show>
);