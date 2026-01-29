"use client"; // remove this line if you choose Pages Router
import { Admin, Resource, ListGuesser, EditGuesser } from "react-admin";
import {AdministratorList} from "@/src/repositories/administrators/admin-resources"
import simpleRestProvider from "ra-data-simple-rest";

const api_url = process.env.NEXT_PRIVATE_API_URL ?? 'http://lllms-dev.ru/api';
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
    {/* <Resource name="questions" list={ListGuesser} edit={EditGuesser} />
    <Resource name="statistics" list={ListGuesser} edit={EditGuesser} /> */}
  </Admin>
);

export default AdminApp;