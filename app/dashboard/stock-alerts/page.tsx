"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, PackageOpen, PackageX, Clock, Search, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/formatters";
import { useSettings } from "@/lib/hooks/useSettings";

interface StockAlert {
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  expiryDate: string;
  location: string;
  type: 'low-stock' | 'expiring' | 'out-of-stock';
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function StockAlertsPage() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('type');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedType, setSelectedType] = useState('');
  const { settings } = useSettings();

  useEffect(() => {
    setIsMounted(true);
    fetchAlerts();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, selectedType]);

  const fetchAlerts = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      
      if (selectedType) {
        params.append('type', selectedType);
      }
      
      const response = await fetch(`/api/inventory/alerts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle new paginated response format
      if (data.data && data.pagination) {
        setAlerts(data.data);
        setPagination(data.pagination);
      } else if (Array.isArray(data)) {
        // Fallback for old format
        setAlerts(data);
      } else {
        console.warn('API returned unexpected data format:', data);
        setAlerts([]);
        setError('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setAlerts([]);
      setError(error instanceof Error ? error.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration mismatch by not rendering dates until mounted
  if (!isMounted) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  // Ensure alerts is always an array before filtering
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const lowStockItems = safeAlerts.filter(item => item.type === 'low-stock');
  const expiringItems = safeAlerts.filter(item => item.type === 'expiring');
  const outOfStockItems = safeAlerts.filter(item => item.type === 'out-of-stock');

  const filteredAlerts = (items: StockAlert[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const AlertTable = ({ items }: { items: StockAlert[] }) => {
    const filtered = filteredAlerts(items);
    
    if (filtered.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed">
          <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100 mb-4">
            <Filter className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No alerts found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery ? "Try adjusting your search" : "Everything looks good!"}
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Reorder Level</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.sku} className="hover:bg-gray-50">
                <TableCell className="font-medium">{item.sku}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <span className={item.type === 'low-stock' || item.type === 'out-of-stock' ? 'text-red-600 font-medium' : ''}>
                    {item.quantity}
                  </span>
                </TableCell>
                <TableCell>{item.reorderLevel}</TableCell>
                <TableCell>
                  {item.expiryDate ? (
                    <span className={item.type === 'expiring' ? 'text-orange-600 font-medium' : ''}>
                      {formatDate(new Date(item.expiryDate), settings)}
                    </span>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.type === 'low-stock' ? 'warning' :
                    item.type === 'expiring' ? 'default' :
                    'destructive'
                  } className="capitalize">
                    {item.type === 'low-stock' ? 'Low Stock' :
                     item.type === 'expiring' ? 'Expiring Soon' :
                     'Out of Stock'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination Navigation */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-center border-t border-gray-200">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.page === pageNum
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={!pagination.hasNext}
                className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-32"></div>
            ))}
          </div>
          <div className="bg-gray-200 rounded-lg h-96"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
            <p className="text-gray-500 mt-1">Monitor inventory status and take action</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Alerts</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAlerts}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
          <p className="text-gray-500 mt-1">Monitor inventory status and take action</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Sorting and Page Size Controls */}
      {pagination.total > 0 && (
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="type">Alert Type</option>
                <option value="name">Product Name</option>
                <option value="quantity">Quantity</option>
                <option value="expiryDate">Expiry Date</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Alerts</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Per page:</label>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span> results
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
              <PackageOpen className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Items below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Items expiring within 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
              <PackageX className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems.length}</div>
            <p className="text-xs text-gray-500 mt-1">Items with zero quantity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="low-stock" className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid grid-cols-3 gap-4 bg-gray-100 p-1">
              <TabsTrigger 
                value="low-stock"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              >
                Low Stock
              </TabsTrigger>
              <TabsTrigger 
                value="expiring"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              >
                Expiring Soon
              </TabsTrigger>
              <TabsTrigger 
                value="out-of-stock"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              >
                Out of Stock
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="low-stock" className="p-6">
            <AlertTable items={lowStockItems} />
          </TabsContent>
          <TabsContent value="expiring" className="p-6">
            <AlertTable items={expiringItems} />
          </TabsContent>
          <TabsContent value="out-of-stock" className="p-6">
            <AlertTable items={outOfStockItems} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
} 