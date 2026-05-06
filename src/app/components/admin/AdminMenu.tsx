// src/MyMenu.tsx
import { Menu, MenuProps, useSidebarState } from 'react-admin';
import Box from '@mui/material/Box';

export const AdminMenu = (props: MenuProps) => {
    const [open] = useSidebarState();

    return (
        <Menu {...props} sx={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 140px)', // Adjust based on AppBar height
        }}>
            {/* Standard Top Items */}
            <Menu.ResourceItem name="requests" />
            <Menu.ResourceItem name="administrators" />
            <Menu.ResourceItem name="orders" />
            <Menu.ResourceItem name="statistics" />
            <Menu.ResourceItem name="users" />
            <Menu.ResourceItem name="contacts" />

            {/* Spacer to push remaining items down */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Bottom Item */}
            <Menu.ResourceItem name="profile" />
        </Menu>
    );
};
