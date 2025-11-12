'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { FaBoxes, FaPills, FaShoppingCart, FaExclamationTriangle, FaMoneyBillWave, FaChartBar, FaBell } from 'react-icons/fa';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';
import { SalesTrendChart } from '../components/SalesTrendChart';
import Link from 'next/link';

interface DashboardStats {
  todaySales: number;
  monthlyRevenue: number;
  lowStockItems: number;
  expiringSoonItems: number;
  expiredItems: number;
}

interface SalesTrendData {
  _id: string;
  totalSales: number;
  count: number;
}

interface RecentSale {
  _id: string;
  totalAmount: number;
  items: Array<{
    product: {
      name: string;
      genericName?: string;
    } | null;
    quantity: number;
    unitPrice: number;
  }>;
  processedBy: {
    name: string;
  } | null;
  createdAt: string;
}

interface InventoryAlert {
  _id: string;
  product: {
    name: string;
    genericName?: string;
  } | null;
  quantity: number;
  reorderLevel: number;
  expiryDate?: string;
}

interface Settings {
  business: {
    pharmacyName: string;
    address: string;
    phone: string;
    email: string;
    registrationNumber?: string;
    taxId?: string;
  };
  localization: {
    currency: string;
    dateFormat: string;
    timeZone: string;
    language: string;
  };
  invoice: {
    prefix: string;
    footer: string;
    terms: string;
    showLogo: boolean;
    showSignature: boolean;
  };
}

const getCurrencySymbol = (currencyCode: string): string => {
  switch (currencyCode) {
    case 'BDT': return '৳';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    default: return currencyCode;
  }
};

const formatCurrency = (amount: number, settings: Settings | null | undefined) => {
  const currencyCode = settings?.localization?.currency || 'USD';
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${new Intl.NumberFormat(settings?.localization?.language || 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    monthlyRevenue: 0,
    lowStockItems: 0,
    expiringSoonItems: 0,
    expiredItems: 0,
  });
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([]);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setStats(data.stats);
        setSalesTrend(data.salesTrend);
        setRecentSales(data.recentSales);
        setInventoryAlerts(data.inventoryAlerts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
          <p className="text-gray-500">Welcome back, {session?.user?.name}</p>
        </div>
        <Link
          href="/dashboard/sales"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:text-white transition-colors font-medium"
        >
          <FaShoppingCart className="text-lg" />
          <span>POS</span>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Today's Sales</p>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.todaySales, settings)}
              </div>
              <p className="text-sm mt-2">Total sales today</p>
            </div>
            <FaShoppingCart className="text-4xl opacity-80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Monthly Revenue</p>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.monthlyRevenue, settings)}
              </div>
              <p className="text-sm mt-2">This month</p>
            </div>
            <FaMoneyBillWave className="text-4xl opacity-80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Stock Alerts</p>
              <p className="text-2xl font-bold">{stats.lowStockItems}</p>
              <p className="text-sm mt-2">Below reorder level</p>
            </div>
            <FaBoxes className="text-4xl opacity-80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Expiring Soon</p>
              <p className="text-2xl font-bold">{stats.expiringSoonItems}</p>
              <p className="text-sm mt-2">Within 3 months</p>
            </div>
            <FaExclamationTriangle className="text-4xl opacity-80" />
          </div>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Sales Trend</h2>
          <div className="text-sm text-gray-500">Last 7 days</div>
        </div>
        <SalesTrendChart 
          data={salesTrend} 
          currency={settings?.localization?.currency || 'USD'} 
        />
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/sales"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaShoppingCart className="text-2xl text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">New Sale</span>
          </Link>
          <Link
            href="/dashboard/inventory"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaPills className="text-2xl text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Add Product</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaChartBar className="text-2xl text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Generate Report</span>
          </Link>
          <Link
            href="/dashboard/stock-alerts"
            className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaBell className="text-2xl text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">View Alerts</span>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Sales</h2>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale._id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(sale.totalAmount, settings)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {sale.items.map(item => (
                        `${item.quantity}x ${item.product?.name || 'Unknown Product'}`
                      )).join(', ')}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      By {sale.processedBy?.name || 'Unknown User'} • {formatDateTime(new Date(sale.createdAt), settings)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Inventory Alerts */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Inventory Alerts</h2>
          <div className="space-y-4">
            {inventoryAlerts.map((alert) => {
              const now = new Date();
              const threeMonthsFromNow = new Date();
              threeMonthsFromNow.setMonth(now.getMonth() + 3);
              const isExpiringSoon = alert.expiryDate && 
                new Date(alert.expiryDate) <= threeMonthsFromNow && 
                new Date(alert.expiryDate) >= now;

              // Skip if not expiring soon
              if (alert.expiryDate && !isExpiringSoon) return null;

              return (
                <div key={alert._id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {alert.product?.name || 'Unknown Product'}
                        {alert.product?.genericName && (
                          <span className="text-gray-500"> ({alert.product.genericName})</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Current stock: {alert.quantity} (Reorder at: {alert.reorderLevel})
                      </p>
                      {alert.expiryDate && (
                        <p className="text-sm text-orange-600">
                          Expires on: {formatDate(new Date(alert.expiryDate), settings)}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {alert.quantity <= alert.reorderLevel && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          Expiring Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        </Card>
      </div>
    </div>
  );
} 