import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesTrendData {
  _id: string;
  totalSales: number;
  count: number;
}

interface SalesTrendChartProps {
  data: SalesTrendData[];
  currency: string;
}

export function SalesTrendChart({ data, currency }: SalesTrendChartProps) {
  const chartData = {
    labels: data.map(item => format(new Date(item._id), 'MMM dd')),
    datasets: [
      {
        label: 'Daily Sales',
        data: data.map(item => item.totalSales),
        fill: true,
        borderColor: 'rgb(59, 130, 246)', // Blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: currency,
            }).format(context.raw as number);
            return `Sales: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: false,
        },
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: currency,
              notation: 'compact',
            }).format(value as number);
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
} 