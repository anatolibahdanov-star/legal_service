import * as React from 'react';
import { List, ListProps } from 'react-admin';
import StatisticDiagram from '@/src/components/admin/statisticDiagram';
import { JSX } from 'react/jsx-runtime';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const StatisticList = (props: JSX.IntrinsicAttributes & ListProps<any>) => (
    <List {...props}>
        {/* Pass your custom component as a child */}
        <StatisticDiagram />
    </List>
);