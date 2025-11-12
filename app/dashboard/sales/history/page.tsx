'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaSearch, FaFilePdf, FaTimes, FaTrash } from 'react-icons/fa';
import { useToast } from '@/components/ui/Toast';
import InvoiceModal from '@/components/sales/InvoiceModal';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface SaleItem {
  product: {
    _id: string;
    name: string;
    sku: string;
    category: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  batchDetails?: {
    batchNumber: string;
    expiryDate: string;
  };
}

interface Sale {
  _id: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  processedBy: {
    _id: string;
    name: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function SalesHistoryPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { settings } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);

  useEffect(() => {
  const fetchSales = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      
      const response = await fetch(`/api/sales?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sales history');
      }
      
      const data = await response.json();
      setSales(data.data || []);
      setFilteredSales(data.data || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showToast('Failed to fetch sales history', 'error');
    } finally {
      setIsLoading(false);
    }
  };
    
    if (session?.user) {
      fetchSales();
    }
  }, [session, dateFilter, pagination.page, pagination.limit, sortBy, sortOrder]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = sales.filter(sale => 
        // Search by customer name
        (sale.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        // Search by sale ID
        sale._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Search by product name in items
        sale.items.some(item => 
          item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredSales(filtered);
    } else {
      setFilteredSales(sales);
    }
  }, [searchQuery, sales]);

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewInvoice = (sale: Sale) => {
    setSelectedSale(sale);
    setShowInvoice(true);
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setSelectedSale(null);
  };

  const handleDeleteClick = (sale: Sale) => {
    setSaleToDelete(sale);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!saleToDelete) return;

    try {
      const response = await fetch(`/api/sales/${saleToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete sale');
      }

      // Remove the deleted sale from state
      setSales(sales => sales.filter(s => s._id !== saleToDelete._id));
      setFilteredSales(filtered => filtered.filter(s => s._id !== saleToDelete._id));
      
      showToast('Sale deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting sale:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete sale', 'error');
    } finally {
      setShowDeleteConfirm(false);
      setSaleToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Transaction History</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <div className="flex flex-col gap-4 justify-between mb-4">
            <div className="flex flex-col md:flex-row w-full gap-4 animate-pulse">
              <div className="flex-1 w-full">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
              <div className="flex-1 w-full">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
            <div className="w-full animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>

          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales History</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <div className="flex flex-col gap-4 justify-between mb-4">
          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateFilter.startDate}
                onChange={handleDateFilterChange}
                className="w-full px-3 py-2 border text-gray-900 bg-white rounded-lg"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-900 mb-1">End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateFilter.endDate}
                onChange={handleDateFilterChange}
                className="w-full px-3 py-2 border text-gray-900 bg-white rounded-lg"
              />
            </div>
          </div>
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-900 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer, ID, or product..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-3 py-2 border text-gray-900 bg-white rounded-lg"
              />
            </div>
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
                  <option value="createdAt">Date</option>
                  <option value="totalAmount">Amount</option>
                  <option value="status">Status</option>
                  <option value="customer">Customer</option>
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

        {filteredSales.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-700">No sales records found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Items
                  </th>
                  <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Payment
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale._id}>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale._id.slice(-6)}
                      <div className="text-xs text-gray-600 md:hidden">
                        {settings ? formatDate(sale.createdAt, settings) : new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 hidden md:table-cell">
                      {settings ? formatDateTime(sale.createdAt, settings) : new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800">
                      {sale.customer?.name || 'Walk-in Customer'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-800 hidden lg:table-cell">
                      <div className="max-w-xs truncate">
                        {sale.items.map((item, itemIndex) => (
                          <div key={`${item.product?._id || 'unknown'}-${itemIndex}`} className="flex flex-col">
                            <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                            <div className="text-sm text-gray-500">SKU: {item.product?.sku || 'N/A'}</div>
                            {item.batchDetails && (
                              <div className="text-sm text-gray-500">
                                Batch: {item.batchDetails.batchNumber}
                                <br />
                                Expires: {settings ? formatDate(item.batchDetails.expiryDate, settings) : new Date(item.batchDetails.expiryDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 text-right">
                      {settings ? formatCurrency(sale.totalAmount, settings) : `$${sale.totalAmount.toFixed(2)}`}
                      <div className="text-xs text-gray-600 md:hidden text-right">
                        via {sale.paymentMethod}
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-800 text-center hidden md:table-cell">
                      <span className="capitalize">{sale.paymentMethod}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                        sale.status === 'returned' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          title="View Receipt"
                          onClick={() => handleViewInvoice(sale)}
                        >
                          <FaFilePdf className="inline" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          title="Delete Sale"
                          onClick={() => handleDeleteClick(sale)}
                        >
                          <FaTrash className="inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

      {showInvoice && selectedSale && (
        <InvoiceModal
          sale={selectedSale}
          onClose={closeInvoice}
        />
      )}

      {showDeleteConfirm && saleToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Delete</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this sale? This will:
              <ul className="list-disc list-inside mt-2">
                <li>Remove the sale record permanently</li>
                <li>Restore the sold quantities back to inventory</li>
                <li>Reactivate any depleted batches</li>
              </ul>
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSaleToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 