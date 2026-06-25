"use client"; // remove this line if you choose Pages Router
import { Admin, Resource } from "react-admin";
import {AdministratorList, AdministratorCreate, AdministratorShow, AdministratorEdit} from "@/src/repositories/administrators/admin-resources"
import {RequestList, RequestEdit, RequestShow} from "@/src/repositories/requests/admin-resources"
import {UserList, UserShow, UserEdit} from "@/src/repositories/users/admin-resources"
import {StatisticList} from "@/src/repositories/statistics/admin-resources"
import {AdministratorAdminIcon, StatisticAdminIcon, QuestionAdminIcon, UserAdminIcon} from '@/src/app/components/Icons'
import simpleRestProvider from "ra-data-simple-rest";
import authProvider from '@/src/app/providers/AdminAuthProvider';
import { AdminLayout } from '@/src/app/components/admin/AdminLayout';
import {ProfileList} from "@/src/repositories/profile/admin-resources"
import { OrderList } from "@/src/repositories/orders/admin-resources";
import {ContactList, ContactShow} from "@/src/repositories/contacts/admin-resources"
import {EmailTemplateList, EmailTemplateEdit} from "@/src/repositories/emailTemplates/admin-resources"
import {SettingsList, SettingsEdit, SettingsCreate, PromptVersionList, PromptVersionCreate, PromptVersionEdit, SettingAuditList} from "@/src/repositories/settings/admin-resources"
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import PaymentsIcon from '@mui/icons-material/Payments';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HistoryIcon from '@mui/icons-material/History';


const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';
console.log('api url', process.env.NEXT_PUBLIC_API_URL, api_url)
const dataProvider = simpleRestProvider(api_url);

const AdminApp = () => (
  <Admin layout={AdminLayout} dataProvider={dataProvider} authProvider={authProvider}>
    {permissions => [
      // eslint-disable-next-line react/jsx-key
      <Resource 
        name="requests" icon={QuestionAdminIcon} options={{ label: 'Запросы' }} 
        list={RequestList} show={RequestShow} edit={RequestEdit} />,
      <Resource key="profile" name="profile" icon={AccountBoxIcon} options={{ label: 'Профайл' }} list={ProfileList} />,
        // Conditionally render the users resource only for 'admin' role
      permissions === 'admin' ? (
          <Resource 
            name="administrators" icon={AdministratorAdminIcon} options={{ label: 'Администраторы' }} 
            list={AdministratorList} create={AdministratorCreate} show={AdministratorShow} edit={AdministratorEdit} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="orders" icon={PaymentsIcon} options={{ label: 'Платежи' }} list={OrderList} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="statistics" icon={StatisticAdminIcon} options={{ label: 'Статистика' }} list={StatisticList} />
      ) : null,
      permissions === 'admin' ? (
          <Resource 
            name="users" icon={UserAdminIcon} options={{ label: 'Пользователи' }} 
            list={UserList} show={UserShow} edit={UserEdit} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="contacts" icon={ContactMailIcon} options={{ label: 'Саппорт' }} list={ContactList} show={ContactShow} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="email_templates" icon={MarkEmailReadIcon} options={{ label: 'Шаблоны писем' }} list={EmailTemplateList} edit={EmailTemplateEdit} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="settings" icon={SettingsIcon} options={{ label: 'Настройки системы' }} list={SettingsList} edit={SettingsEdit} create={SettingsCreate} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="prompt_versions" icon={SmartToyIcon} options={{ label: 'Промпты ИИ' }} list={PromptVersionList} edit={PromptVersionEdit} create={PromptVersionCreate} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="setting_audit" icon={HistoryIcon} options={{ label: 'История настроек' }} list={SettingAuditList} />
      ) : null,
    ]}
  </Admin>
);

export default AdminApp;