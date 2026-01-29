"use client"; // remove this line if you choose Pages Router
import { Admin, Resource, ListGuesser, EditGuesser } from "react-admin";
import {AdministratorList} from "@/src/repositories/administrators/admin-resources"
import {RequestList} from "@/src/repositories/requests/admin-resources"
import simpleRestProvider from "ra-data-simple-rest";

const api_url = process.env.API_URL ?? 'http://lllms-dev.ru/api';
// const api_url = process.env.API_URL ?? 'http://localhost/api';
console.log('api url', process.env.API_URL, api_url)
console.log('rest ', api_url)
const dataProvider = simpleRestProvider(api_url);

const AdminApp = () => (
  <Admin dataProvider={dataProvider}>
    {/* <Resource
      name="users"
      list={ListGuesser}
      edit={EditGuesser}
      recordRepresentation="name"
    />
    <Resource
      name="posts"
      list={ListGuesser}
      edit={EditGuesser}
      recordRepresentation="title"
    />
    <Resource name="comments" list={ListGuesser} edit={EditGuesser} /> */}
    <Resource name="administrators" list={AdministratorList} />
    <Resource name="requests" list={RequestList} />
    <Resource name="statistics" list={AdministratorList} />
    {/* <Resource name="questions" list={ListGuesser} edit={EditGuesser} />
    <Resource name="statistics" list={ListGuesser} edit={EditGuesser} /> */}
  </Admin>
);

export default AdminApp;