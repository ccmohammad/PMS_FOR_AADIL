'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaChartLine, FaChartBar, FaChartPie, FaFileExport } from 'react-icons/fa';
import { useToast } from '@/components/ui/Toast';
import React from 'react';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
    batchSales: Array<{
      batchNumber: string;
      quantity: number;
      revenue: number;
      expiryDate: string;
    }>;
  }>;
}

interface InventorySummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  expiringSoonItems: number;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
  });
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topSellingProducts: [],
  });
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalStockValue: 0,
    lowStockItems: 0,
    expiringSoonItems: 0,
  });

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        
        const response = await fetch(`/api/reports?${queryParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch report data');
        }
        
        const data = await response.json();
        setSalesSummary(data.salesSummary);
        setInventorySummary(data.inventorySummary);
      } catch (error) {
        console.error('Error fetching report data:', error);
        showToast('Failed to fetch report data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user) {
      fetchReportData();
    }
  }, [session, dateRange, settings]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleExportReport = () => {
    // Generate CSV content
    const csvContent = [];
    
    // Add headers
    csvContent.push(['Report Period:', `${formatDate(dateRange.startDate, settings)} to ${formatDate(dateRange.endDate, settings)}`]);
    csvContent.push([]);
    
    // Sales Summary
    csvContent.push(['Sales Summary']);
    csvContent.push(['Total Sales', salesSummary.totalSales]);
    csvContent.push(['Total Revenue', formatCurrency(salesSummary.totalRevenue, settings)]);
    csvContent.push(['Average Order Value', formatCurrency(salesSummary.averageOrderValue, settings)]);
    csvContent.push([]);
    
    // Top Selling Products
    csvContent.push(['Top Selling Products']);
    csvContent.push(['Product', 'Total Quantity', 'Total Revenue', 'Batch Number', 'Batch Quantity', 'Batch Revenue', 'Expiry Date']);
    salesSummary.topSellingProducts.forEach(product => {
      if (product.batchSales.length > 0) {
        // Add each batch as a separate row
        product.batchSales.forEach(batch => {
          csvContent.push([
            product.name,
            product.quantity,
            formatCurrency(product.revenue, settings),
            batch.batchNumber,
            batch.quantity,
            formatCurrency(batch.revenue, settings),
            formatDate(batch.expiryDate, settings)
          ]);
        });
      } else {
        // Add product without batch information
        csvContent.push([
          product.name,
          product.quantity,
          formatCurrency(product.revenue, settings),
          'N/A',
          'N/A',
          'N/A',
          'N/A'
        ]);
      }
    });
    csvContent.push([]);
    
    // Inventory Summary
    csvContent.push(['Inventory Summary']);
    csvContent.push(['Total Products', inventorySummary.totalProducts]);
    csvContent.push(['Total Stock Value', formatCurrency(inventorySummary.totalStockValue, settings)]);
    csvContent.push(['Low Stock Items', inventorySummary.lowStockItems]);
    csvContent.push(['Expiring Soon Items', inventorySummary.expiringSoonItems]);
    
    // Convert to CSV string
    const csvString = csvContent
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Create blob and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `pharmacy-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <div className="flex space-x-4 animate-pulse">
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales Summary Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="h-6 w-6 bg-gray-200 rounded-full mr-2"></div>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Summary Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="h-6 w-6 bg-gray-200 rounded-full mr-2"></div>
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-50 p-4 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" key={settings?.localization?.currency || 'default'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
        <button 
          onClick={handleExportReport}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FaFileExport /> Export Report
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
          <FaChartLine className="mr-2 text-blue-600" /> Date Range Selection
        </h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="w-full px-3 py-2 border rounded-lg text-gray-900"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-900 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="w-full px-3 py-2 border rounded-lg text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
            <FaChartBar className="mr-2 text-green-600" /> Sales Summary
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Total Sales</div>
                <div className="text-2xl font-bold text-gray-900">{salesSummary.totalSales}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Total Revenue</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(salesSummary.totalRevenue, settings)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Avg. Order Value</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(salesSummary.averageOrderValue, settings)}</div>
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium mb-2 text-gray-900">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty Sold
                      </th>
                      <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesSummary.topSellingProducts.map((product) => (
                      <React.Fragment key={product.productId}>
                        <tr>
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                            {product.quantity}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(product.revenue, settings)}
                          </td>
                        </tr>
                        {product.batchSales.length > 0 && (
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="px-3 py-2">
                              <div className="text-xs font-medium text-gray-500 mb-1">Batch Details:</div>
                              <div className="space-y-1">
                                {product.batchSales.map((batch) => (
                                  <div key={batch.batchNumber} className="flex justify-between text-xs text-gray-600">
                                    <div>
                                      Batch: {batch.batchNumber}
                                      <span className="mx-2">•</span>
                                      Expires: {formatDate(batch.expiryDate, settings)}
                                    </div>
                                    <div>
                                      Qty: {batch.quantity}
                                      <span className="mx-2">•</span>
                                      Revenue: {formatCurrency(batch.revenue, settings)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
            <FaChartPie className="mr-2 text-indigo-600" /> Inventory Summary
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Total Products</div>
                <div className="text-2xl font-bold text-gray-900">{inventorySummary.totalProducts}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Stock Value</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(inventorySummary.totalStockValue, settings)}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Low Stock</div>
                <div className="text-2xl font-bold text-yellow-600">{inventorySummary.lowStockItems}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700">Expiring Soon</div>
                <div className="text-2xl font-bold text-red-600">{inventorySummary.expiringSoonItems}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 