// in src/posts/PostDiagram.jsx
import * as React from 'react';
import { useListContext } from 'react-admin'; // Use useListContext hook in modern RA versions
import { DBStatistic } from '@/src/repositories/statistics/repo';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Average time per day for request handling.',
    },
  },
};

const StatisticDiagram = () => {
    // The useListContext hook provides the records and other list controller props
    const { data, total } = useListContext();
    console.log('use list content', data, total)
    if(data === undefined) {
        return <>No data in Statistic.</>
    }
    const labels = data.map(dataStatistic => dataStatistic.st_date);
    const llms = data.map(dataStatistic => dataStatistic.avg_llm_time)
    const managers = data.map(dataStatistic => dataStatistic.avg_manager_time)
    const requests = data.map(dataStatistic => dataStatistic.avg_request_time)

    console.log('Data labels', labels)
    console.log('Data llms', llms)
    console.log('Data managers', managers)
    console.log('Data requests', requests)

    const _data = {
        labels,
        datasets: [
            {
                label: 'Average LLM time',
                data: llms,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
                label: 'Average manager time',
                data: managers,
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
                label: 'Average request time',
                data: requests,
                borderColor: 'rgb(53, 235, 90)',
                backgroundColor: 'rgba(53, 235, 153, 0.5)',
            },
        ],
    };

    return (
        <><Line options={options} data={_data} /></>
    );
};

export default StatisticDiagram;
