'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaExclamationTriangle, FaCalendarAlt, FaTrash, FaFileImport } from 'react-icons/fa';
import { useToast } from '@/components/ui/Toast';
import { IInventory } from '@/models/Inventory';
import { IProduct } from '@/models/Product';
import Select from 'react-select';
import { formatDate } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface InventoryWithProduct extends Omit<IInventory, 'product'> {
  _id: string;
  product: IProduct | null;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
}

interface ProductOption {
  value: string;
  label: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function InventoryPage() {
  const { showToast } = useToast();
  const { settings } = useSettings();
  const [inventory, setInventory] = useState<InventoryWithProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [formData, setFormData] = useState({
    product: '',
    batch: '',
    quantity: '',
    location: '',
    reorderLevel: '',
    expiryDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('product.name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        let url = '/api/inventory';
        const params = new URLSearchParams();
        
        // Add pagination parameters
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (showLowStock) {
          params.append('lowStock', 'true');
        }
        
        if (showExpiringSoon) {
          params.append('expiringSoon', 'true');
        }
        
        if (searchQuery) {
          params.append('query', searchQuery);
        }
        
        url += `?${params.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory');
        }
        
        const data = await response.json();
        setInventory(data.data || []);
        setPagination(data.pagination || pagination);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        showToast('Failed to fetch inventory', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInventory();
  }, [searchQuery, showLowStock, showExpiringSoon, pagination.page, pagination.limit, sortBy, sortOrder, showToast]);

  // Fetch products when modal opens
  useEffect(() => {
    if (showAddModal) {
      const fetchProducts = async () => {
        try {
          const response = await fetch('/api/products');
          if (!response.ok) throw new Error('Failed to fetch products');
          const data = await response.json();
          setProducts(data.data);
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };
      fetchProducts();
    }
  }, [showAddModal]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddInventory = () => {
    setShowAddModal(true);
  };

  const handleBulkImport = () => {
    window.location.href = '/dashboard/inventory/bulk-import';
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | ProductOption | null,
    selectName?: string
  ) => {
    if (selectName === 'product' && e && 'value' in e) {
      setFormData(prev => ({
        ...prev,
        product: e.value
      }));
    } else if (e && 'target' in e) {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if inventory already exists for this product and batch
      const existingInventory = inventory.find(
        item => item.product?._id === formData.product && item.batch === formData.batch
      );

      let response;
      if (existingInventory) {
        // Update existing inventory
        response = await fetch(`/api/inventory/${existingInventory._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            quantity: parseInt(formData.quantity) + existingInventory.quantity
          }),
        });
      } else {
        // Create new inventory
        response = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) throw new Error('Failed to add/update inventory');

      const updatedInventory = await response.json();
      
      if (existingInventory) {
        // Update existing inventory in state
        setInventory(prevInventory => 
          prevInventory.map(item => 
            item._id === existingInventory._id ? updatedInventory : item
          )
        );
        showToast('Inventory updated successfully', 'success');
      } else {
        // Add new inventory to state
        setInventory(prevInventory => [...prevInventory, updatedInventory]);
        showToast('Inventory added successfully', 'success');
      }

      setShowAddModal(false);
      setFormData({
        product: '',
        batch: '',
        quantity: '',
        location: '',
        reorderLevel: '',
        expiryDate: ''
      });
    } catch (error) {
      console.error('Error adding/updating inventory:', error);
      showToast('Failed to add/update inventory. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete inventory');
        }
        
        setInventory(prevInventory => prevInventory.filter(item => item._id !== id));
        showToast('Inventory item deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting inventory:', error);
        showToast('Failed to delete inventory. Please try again.', 'error');
      }
    }
  };

  // Helper to determine if stock is low
  const isLowStock = (item: InventoryWithProduct) => {
    return item.quantity <= item.reorderLevel;
  };

  // Helper to determine if product is expiring soon (within 90 days)
  const isExpiringSoon = (item: InventoryWithProduct) => {
    if (!item.expiryDate) return false;
    
    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    const ninetyDaysFromNow = new Date(now);
    ninetyDaysFromNow.setDate(now.getDate() + 90);
    
    return expiryDate <= ninetyDaysFromNow && expiryDate >= now;
  };

  // Helper to determine if product is expired
  const isExpired = (item: InventoryWithProduct) => {
    if (!item.expiryDate) return false;
    
    const expiryDate = new Date(item.expiryDate);
    const now = new Date();
    
    return expiryDate < now;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Stock Management</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="flex space-x-4 animate-pulse">
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
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
        <h1 className="text-2xl font-bold">Stock Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleBulkImport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            disabled={isSubmitting}
          >
            <FaFileImport /> Bulk Import
          </button>
          <button
            onClick={handleAddInventory}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            <FaPlus /> Add Inventory
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search inventory..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={handleSearch}
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
            <button
              onClick={() => setShowLowStock(!showLowStock)}
              className={`px-4 py-2 rounded-lg ${
                showLowStock ? 'bg-red-500 text-white' : 'bg-gray-100'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setShowExpiringSoon(!showExpiringSoon)}
              className={`px-4 py-2 rounded-lg ${
                showExpiringSoon ? 'bg-yellow-500 text-white' : 'bg-gray-100'
              }`}
            >
              Expiring Soon
            </button>
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
                  <option value="product.name">Product Name</option>
                  <option value="quantity">Quantity</option>
                  <option value="expiryDate">Expiry Date</option>
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

        {inventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-sm text-gray-700">
                        SKU: {item.product?.sku || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.batch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        isLowStock(item) ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.quantity} {isLowStock(item) && (
                          <FaExclamationTriangle className="inline ml-1 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Reorder at: {item.reorderLevel}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        isExpired(item) ? 'text-red-600' :
                        isExpiringSoon(item) ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {item.expiryDate ? formatDate(item.expiryDate, settings) : 'N/A'}
                        {isExpired(item) && (
                          <FaExclamationTriangle className="inline ml-1 text-red-500" />
                        )}
                        {isExpiringSoon(item) && !isExpired(item) && (
                          <FaCalendarAlt className="inline ml-1 text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isExpired(item) && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                      {isLowStock(item) && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 ml-1">
                          Low Stock
                        </span>
                      )}
                      {isExpiringSoon(item) && !isExpired(item) && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 ml-1">
                          Expiring Soon
                        </span>
                      )}
                      {!isLowStock(item) && !isExpiringSoon(item) && !isExpired(item) && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Good
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete inventory"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500">No inventory items found. Please add inventory or adjust your search filters.</p>
          </div>
        )}
      </div>

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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add Inventory</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Product</label>
                <Select<ProductOption>
                  name="product"
                  value={products.find(p => p._id === formData.product) ? {
                    value: formData.product,
                    label: `${products.find(p => p._id === formData.product)?.name} (${products.find(p => p._id === formData.product)?.genericName})`
                  } : null}
                  onChange={(newValue) => handleInputChange(newValue as ProductOption, 'product')}
                  options={products.filter(product => product._id).map(product => ({
                    value: product._id as string,
                    label: `${product.name} (${product.genericName})`
                  }))}
                  className="text-sm"
                  placeholder="Search by product name or generic name..."
                  isClearable
                  isSearchable
                  required
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: '#e5e7eb',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      }
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#e5e7eb' : 'white',
                      color: state.isSelected ? 'white' : '#111827',
                      ':active': {
                        backgroundColor: state.isSelected ? '#3b82f6' : '#e5e7eb'
                      }
                    }),
                    input: (base) => ({
                      ...base,
                      color: '#111827'
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: '#111827'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#9ca3af'
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 50
                    })
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Batch Number</label>
                <input 
                  type="text"
                  name="batch"
                  value={formData.batch}
                  onChange={handleInputChange}
                  placeholder="Enter batch number"
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Quantity</label>
                <input 
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Enter quantity"
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Location</label>
                <input 
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter storage location"
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Reorder Level</label>
                <input 
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Enter reorder level"
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Expiry Date</label>
                <input 
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg text-gray-900 bg-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
              <button
                  type="button"
                onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add Inventory'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 