"use client"; // remove this line if you choose Pages Router
import { Admin, Resource } from "react-admin";
import {AdministratorList, AdministratorCreate, AdministratorShow, AdministratorEdit} from "@/src/repositories/administrators/admin-resources"
import {RequestList, RequestEdit, RequestShow} from "@/src/repositories/requests/admin-resources"
import {StatisticList} from "@/src/repositories/statistics/admin-resources"
import {AdministratorAdminIcon, StatisticAdminIcon, QuestionAdminIcon} from '@/src/components/Icons'
import simpleRestProvider from "ra-data-simple-rest";
import authProvider from '@/src/app/providers/AdminAuthProvider';


const api_url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost/api';
console.log('api url', process.env.NEXT_PUBLIC_API_URL, api_url)
const dataProvider = simpleRestProvider(api_url);

const AdminApp = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    {permissions => [
      // eslint-disable-next-line react/jsx-key
      <Resource 
        name="requests" icon={QuestionAdminIcon} options={{ label: 'User questions' }} 
        list={RequestList} show={RequestShow} edit={RequestEdit} />,
        // Conditionally render the users resource only for 'admin' role
      permissions === 'admin' ? (
          <Resource 
            name="administrators" icon={AdministratorAdminIcon} options={{ label: 'Admins' }} 
            list={AdministratorList} create={AdministratorCreate} show={AdministratorShow} edit={AdministratorEdit} />
      ) : null,
      permissions === 'admin' ? (
          <Resource name="statistics" icon={StatisticAdminIcon} options={{ label: 'Statistic' }} list={StatisticList} />
      ) : null,
    ]}
  </Admin>
);

export default AdminApp;