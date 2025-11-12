'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHistory, FaTimes } from 'react-icons/fa';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

interface Sale {
  _id: string;
  items: Array<{
    product: {
      name: string;
      sku: string;
    };
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CustomersPage() {
  const { settings } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Sales history modal state
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, sortBy, sortOrder, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
      });
      
      if (searchTerm) {
        params.append('query', searchTerm);
      }
      
      const response = await fetch(`/api/customers?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.data || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerSales = async (customerId: string) => {
    setSalesLoading(true);
    try {
      const response = await fetch(`/api/sales?customerId=${customerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCustomerSales(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch customer sales:', response.status, errorData);
        setCustomerSales([]);
      }
    } catch (error) {
      console.error('Error fetching customer sales:', error);
      setCustomerSales([]);
    } finally {
      setSalesLoading(false);
    }
  };

  const handleViewSales = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowSalesModal(true);
    await fetchCustomerSales(customer._id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer._id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCustomers();
        setShowAddModal(false);
        setEditingCustomer(null);
        setFormData({ name: '', phone: '', email: '', address: '' });
      } else {
        const error = await response.json();
        alert(error.message || 'Error saving customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCustomers();
      } else {
        const error = await response.json();
        alert(error.error || error.message || 'Error deleting customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error deleting customer');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setEditingCustomer(null);
    setShowAddModal(false);
  };

  const closeSalesModal = () => {
    setShowSalesModal(false);
    setSelectedCustomer(null);
    setCustomerSales([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <FaPlus /> Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
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
                <option value="name">Name</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="createdAt">Date Added</option>
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

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-2">
                      <FaPhone className="text-gray-400" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                        <FaEnvelope className="text-gray-400" />
                        {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {customer.address ? (
                      <div className="text-sm text-gray-900 flex items-start gap-2">
                        <FaMapMarkerAlt className="text-gray-400 mt-0.5" />
                        <span className="max-w-xs truncate">{customer.address}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewSales(customer)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="View Sales History"
                    >
                      <FaHistory />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit Customer"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(customer._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Customer"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {customers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer!'}
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales History Modal */}
      {showSalesModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sales History</h2>
                <p className="text-gray-600">{selectedCustomer.name} - {selectedCustomer.phone}</p>
              </div>
              <button
                onClick={closeSalesModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {salesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : customerSales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <FaHistory size={48} className="mx-auto" />
                  </div>
                  <p className="text-gray-500">No sales history found for this customer.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{customerSales.length}</div>
                        <div className="text-sm text-gray-600">Total Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {settings ? formatCurrency(
                            customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
                            settings
                          ) : `$${customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2)}`}
                        </div>
                        <div className="text-sm text-gray-600">Total Spent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {settings ? formatCurrency(
                            customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / customerSales.length,
                            settings
                          ) : `$${(customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / customerSales.length).toFixed(2)}`}
                        </div>
                        <div className="text-sm text-gray-600">Average Order</div>
                      </div>
                    </div>
                  </div>

                  {/* Sales List */}
                  <div className="space-y-3">
                    {customerSales.map((sale) => (
                      <div key={sale._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Sale #{sale._id.slice(-6)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {settings ? formatDate(sale.createdAt, settings) : new Date(sale.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {settings ? formatCurrency(sale.totalAmount, settings) : `$${sale.totalAmount.toFixed(2)}`}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {sale.paymentMethod}
                            </div>
                          </div>
                        </div>
                        
                        {/* Items */}
                        <div className="space-y-2">
                          {sale.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">{item.product?.name || 'Unknown Product'}</div>
                                <div className="text-gray-500">SKU: {item.product?.sku || 'N/A'}</div>
                              </div>
                              <div className="text-right">
                                <div>Qty: {item.quantity}</div>
                                <div className="text-gray-500">
                                  {settings ? formatCurrency(item.unitPrice, settings) : `$${item.unitPrice.toFixed(2)}`} each
                                  {item.discount > 0 && (
                                    <span className="text-red-500 ml-1">
                                      (-{settings ? formatCurrency(item.discount, settings) : `$${item.discount.toFixed(2)}`})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Status */}
                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'returned' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.status}
                          </span>
                          <div className="text-sm text-gray-500">
                            {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 