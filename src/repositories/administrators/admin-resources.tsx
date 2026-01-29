import { List, DataTable, DateField, BooleanField } from 'react-admin';

export const AdministratorList = () => (
    <List>
        <DataTable>
            <DataTable.Col source="admin_id" />
            <DataTable.Col source="name" />
            <DataTable.Col source="username" />
            <DataTable.Col source="email" />
            <DataTable.Col source="created_at" field={DateField} />
            <DataTable.Col source="is_super" field={BooleanField} />
        </DataTable>
    </List>
);