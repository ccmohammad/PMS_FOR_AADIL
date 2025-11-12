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
  ChartData,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    borderColor: string;
    borderDash?: number[];
  }[];
}

const LineChart: React.FC<LineChartProps> = ({ labels, datasets }) => {
  const data: ChartData<'line'> = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      tension: 0.4,
      fill: false,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default LineChart; 