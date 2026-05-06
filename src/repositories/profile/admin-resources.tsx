import { ListProps } from 'react-admin';
import {ProfileScreen} from '@/src/app/components/screen/Profile';
import { JSX } from 'react/jsx-runtime';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ProfileList = (props: JSX.IntrinsicAttributes & ListProps<any>) => (
    <ProfileScreen />
);