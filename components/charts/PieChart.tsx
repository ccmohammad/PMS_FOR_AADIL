import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface PieChartProps {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor: string[];
  }[];
}

const PieChart: React.FC<PieChartProps> = ({ labels, datasets }) => {
  const data: ChartData<'pie'> = {
    labels,
    datasets: datasets.map(dataset => ({
      ...dataset,
      borderWidth: 2,
      borderColor: 'white',
      hoverOffset: 4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return <Pie data={data} options={options} />;
};

export default PieChart; 