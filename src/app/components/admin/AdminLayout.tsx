import { Layout, LayoutProps } from 'react-admin';
import { AdminMenu } from '@/src/app/components/admin/AdminMenu';

export const AdminLayout = (props: LayoutProps) => <Layout {...props} menu={AdminMenu} />;