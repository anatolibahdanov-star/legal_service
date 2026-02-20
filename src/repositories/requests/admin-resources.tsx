import { RichTextField, Show, SimpleShowLayout, required, SelectInput, TextInput, SimpleForm, Edit, List, Datagrid, DateField, TextField, SelectField, EditButton, DeleteButton} from 'react-admin';
import {RichTextInput} from "ra-input-rich-text"

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


const requestFilters = [
    // eslint-disable-next-line react/jsx-key
    // <TextInput label="Search" source="q" alwaysOn />,
    // eslint-disable-next-line react/jsx-key
    <TextInput label="Пользователь" source="username" defaultValue="Hello, World!" />,
];

export const RequestList = () => (
    <List sort={{ field: 'id', order: 'DESC' }} filters={requestFilters}>
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