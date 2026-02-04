"use client"; // remove this line if you choose Pages Router
import { Admin, Resource } from "react-admin";
import {AdministratorList, AdministratorCreate, AdministratorShow, AdministratorEdit} from "@/src/repositories/administrators/admin-resources"
import {RequestList, RequestEdit, RequestShow} from "@/src/repositories/requests/admin-resources"
import {StatisticList} from "@/src/repositories/statistics/admin-resources"
import {AdministratorAdminIcon, StatisticAdminIcon, QuestionAdminIcon} from '@/src/components/Icons'
import simpleRestProvider from "ra-data-simple-rest";


// const api_url = process.env.API_URL ?? 'http://lllms-dev.ru/api';
const api_url = process.env.API_URL ?? 'http://localhost/api';
console.log('api url', process.env.API_URL, api_url)
console.log('rest ', api_url)
const dataProvider = simpleRestProvider(api_url);

const AdminApp = () => (
  <Admin dataProvider={dataProvider}>
    <Resource 
      name="administrators" icon={AdministratorAdminIcon} options={{ label: 'Admins' }} 
      list={AdministratorList} create={AdministratorCreate} show={AdministratorShow} edit={AdministratorEdit} />
    <Resource 
      name="requests" icon={QuestionAdminIcon} options={{ label: 'User questions' }} 
      list={RequestList} show={RequestShow} edit={RequestEdit} />
    <Resource name="statistics" icon={StatisticAdminIcon} options={{ label: 'Statistic' }} list={StatisticList} />
  </Admin>
);

export default AdminApp;