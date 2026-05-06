import { DateInput, Filter, Datagrid, TextField, List, DateField, TextInput, SelectInput, SelectField } from 'react-admin';
import { JSX } from 'react/jsx-runtime';
import { UserStatusesE, UserRolesE } from '@/src/interfaces/data';
import { getAdminChoices } from '@/src/helpers/tools';
import { OrderStatusE, OrderTypeE } from '@/src/interfaces/payment';

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);
const defaultLoading = <p>Загружаем администраторов и юристов...</p>

const OrderFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="Пользователь" source="user_name" />
        <TextInput label="E-mail" source="user_email" />
        <TextInput label="Альфа ID" source="alpha_id" />
        <SelectInput label="Статус" source="status" choices={getAdminChoices(OrderStatusE, "Статус платежа: ", true)} />
        <SelectInput label="Тип" source="order_type" choices={getAdminChoices(OrderTypeE, "Тип платежа: ", true)} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

export const OrderList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<OrderFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField label="Пользователь" source="user_name" />
            <TextField label="Альфа ID" source="alpha_id" />
            <TextField label="Альфа Статус" source="alpha_status" />
            <TextField label="Альфа QR" source="alpha_qr_url" />
            <SelectField label="Тип" source='ptype' choices={getAdminChoices(OrderTypeE, "Тип платежа: ")} optionValue={'ptype'} />
            <SelectField label="Статус" source='status' choices={getAdminChoices(OrderStatusE, "Статус платежа: ")} optionValue={'status'} />
            <DateField label="Дата" source='created_at' locales="ru-RU" showTime />
            {/* <EditButton />
            <DeleteButton /> */}
        </Datagrid>
    </List>
);