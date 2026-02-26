/* eslint-disable react/jsx-key */
import { ReferenceInput, Filter, DateInput, RichTextField, Show, SimpleShowLayout, required, SelectInput, TextInput, SimpleForm, Edit, List, Datagrid, DateField, TextField, SelectField, EditButton, DeleteButton, FilterProps} from 'react-admin';
import {RichTextInput} from "ra-input-rich-text"
import { JSX } from 'react/jsx-runtime';

const QuestionStatuses = [
    { id: 0, name: 'Disabled' },
    { id: 1, name: 'New' },
    { id: 2, name: 'In progress' },
    { id: 3, name: 'Spam' },
    { id: 4, name: 'Approved' },
]

const QuestionEmailStatuses = [
    { id: 0, name: 'None' },
    { id: 1, name: 'Sent' },
    { id: 2, name: 'Error' },
]

const nextMonth = new Date()
nextMonth.setMonth(nextMonth.getMonth() + 1);

const RequestFilters = (props: JSX.IntrinsicAttributes) => (
    <Filter {...props}>
        <TextInput label="Пользователь" source="username" />
        <TextInput label="Вопрос" source="question" />
        <ReferenceInput label="Категория" source="category" reference="categories">
            <SelectInput optionText="name" />
        </ReferenceInput>
        <SelectInput label="Статус" source="status" choices={QuestionStatuses} />
        <SelectInput label="E-mail" source="email" choices={QuestionEmailStatuses} />
        <DateInput label="С" source="published_at_gte" defaultValue={(new Date()).toISOString().split('T')[0]} />
        <DateInput label="До" source="published_at_lte" defaultValue={nextMonth.toISOString().split('T')[0]} />
    </Filter>
);

const defaultLoading = <p>Загружаем вопросы...</p>

export const RequestList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={<RequestFilters />} loading={defaultLoading}>
        <Datagrid>
            <TextField source="id" />
            <TextField source="username" />
            <TextField label="Category" source="category_name" />
            <TextField source="question" />
            <SelectField source='status' choices={QuestionStatuses} optionValue={'status'} />
            <SelectField label="Email" source='email_status' choices={QuestionEmailStatuses} optionValue={'email_status'} />
            <DateField source='created_at' locales="ru-RU" />
            <>
                <EditButton />
                <DeleteButton />
            </>
        </Datagrid>
    </List>
);

export const RequestEdit = () => (
    <Edit loading={<p>Loading the question details...</p>}>
        <SimpleForm>
            <TextInput source="username" readOnly />
            <TextInput source="category_name" readOnly />
            <TextInput source="question" readOnly />
            <TextInput source="reply_id" style={{ display: 'none' }} />
            <TextInput source="final_reply_id" style={{ display: 'none' }} />
            <RichTextInput source="reply" readOnly />
            <RichTextInput source="final_reply" validate={[required()]} />
            <SelectInput source="status" choices={QuestionStatuses} />
        </SimpleForm>
    </Edit>
);

export const RequestShow = () => (
    <Show loading={<p>Loading the questions...</p>}>
        <SimpleShowLayout>
            <TextField source="id" />
            <TextField source="username" />
            <TextField label="Category" source="category_name" />
            <TextField source="question" />
            <TextField source="reply_id" />
            <RichTextField source="reply" />
            <TextField source="final_reply_id" />
            <RichTextField source="final_reply" />
            <SelectField source='status' choices={QuestionStatuses} optionValue={'status'} />
            <SelectField label="Email" source='email_status' choices={QuestionEmailStatuses} optionValue={'email_status'} />
            <DateField label="Created date" source="created_at" />
        </SimpleShowLayout>
    </Show>
);