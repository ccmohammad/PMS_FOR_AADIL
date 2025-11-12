'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { FaChartLine, FaPills, FaMoneyBillWave, FaBoxes, FaChartBar, FaChartPie } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useSettings } from '@/lib/hooks/useSettings';
import { formatCurrency } from '@/lib/formatters';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  salesData: {
    labels: string[];
    actual: number[];
  };
  totalRevenue: number;
  profitMargin: number;
  inventoryValue: {
    cost: number;
    market: number;
  };
  quarterlyTurnover: Array<{
    label: string;
    turnover: number;
  }>;
  topProducts: Array<{
    name: string;
    revenue: number;
    margin: number;
    turnover: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const { settings } = useSettings();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const chartOptions = {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
        <select 
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(analyticsData?.totalRevenue || 0, settings)}</p>
              <p className="text-sm mt-2">Last 6 months</p>
            </div>
            <FaMoneyBillWave className="text-4xl opacity-80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Avg. Profit Margin</p>
              <p className="text-2xl font-bold">{(analyticsData?.profitMargin || 0).toFixed(1)}%</p>
              <p className="text-sm mt-2">Last 6 months</p>
            </div>
            <FaChartPie className="text-4xl opacity-80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Inventory Value</p>
              <p className="text-2xl font-bold">{formatCurrency(analyticsData?.inventoryValue.market || 0, settings)}</p>
              <div className="text-sm mt-2 space-y-1">
                <p>Market Value (Selling Price)</p>
                <p className="opacity-80">Cost: {formatCurrency(analyticsData?.inventoryValue.cost || 0, settings)}</p>
              </div>
            </div>
            <FaBoxes className="text-4xl opacity-80" />
          </div>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Sales Trend</h2>
        <div className="h-80">
          <Line
            data={{
              labels: analyticsData?.salesData.labels || [],
              datasets: [
                {
                  label: 'Revenue',
                  data: analyticsData?.salesData.actual || [],
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  fill: true,
                  tension: 0.4,
                },
              ],
            }}
            options={chartOptions}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Products Performance</h2>
          <div className="space-y-4">
            {analyticsData?.topProducts.map((product, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{product.name}</h3>
                  <span className="text-green-600 font-medium">
                    {formatCurrency(product.revenue, settings)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span>Profit Margin: </span>
                    <span className="font-medium text-blue-600">{product.margin.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span>Turnover Rate: </span>
                    <span className="font-medium text-purple-600">{product.turnover.toFixed(1)}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Inventory Turnover Analysis</h2>
          <div className="h-80">
            <Bar
              data={{
                labels: analyticsData?.quarterlyTurnover.map(q => q.label) || [],
                datasets: [
                  {
                    label: 'Turnover Rate',
                    data: analyticsData?.quarterlyTurnover.map(q => q.turnover) || [],
                    backgroundColor: '#8b5cf6',
                    borderRadius: 6,
                    maxBarThickness: 40,
                  },
                ],
              }}
              options={chartOptions}
            />
          </div>
        </Card>
      </div>
    </div>
  );
} 