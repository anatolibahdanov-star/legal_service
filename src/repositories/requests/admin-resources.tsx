import { List, DataTable, DateField, BooleanField } from 'react-admin';

export const RequestList = () => (
    <List>
        <DataTable>
            <DataTable.Col source="id" />
            <DataTable.Col source="username" />
            <DataTable.Col source="question" />
            <DataTable.Col source="status" field={BooleanField} />
            <DataTable.Col source="created_at" field={DateField} />
        </DataTable>
    </List>
);