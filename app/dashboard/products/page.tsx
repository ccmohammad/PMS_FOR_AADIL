'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaFileImport, FaBarcode } from 'react-icons/fa';
import { IProduct } from '@/models/Product';
import ProductForm from '@/components/products/ProductForm';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';
import { BarcodeGenerator } from '@/components/products/BarcodeGenerator';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const { settings } = useSettings();
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<IProduct | null>(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let url = '/api/products';
        const params = new URLSearchParams();
        
        // Add pagination parameters
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (searchQuery) {
          params.append('query', searchQuery);
        }
        
        if (selectedCategory) {
          params.append('category', selectedCategory);
        }
        
        url += `?${params.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        setProducts(data.data || []);
        setPagination(data.pagination || pagination);
        
        // Extract unique categories with proper type casting
        const uniqueCategories = [...new Set((data.data || []).map((product: IProduct) => product.category))] as string[];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [searchQuery, selectedCategory, pagination.page, pagination.limit, sortBy, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const handleEditProduct = (product: IProduct) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p._id === productId);
    const productName = product?.name || 'this product';
    
    if (!confirm(`Are you sure you want to delete "${productName}"?\n\nNote: Products cannot be deleted if they have:\n• Associated sales records\n• Existing inventory records\n\nThis helps maintain data integrity and audit trails.`)) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Show specific error message from API
        if (errorData.message) {
          alert(errorData.message);
        } else if (errorData.error) {
          alert(errorData.error);
        } else {
          alert('Failed to delete product. Please try again.');
        }
        return;
      }
      
      const result = await response.json();
      
      // Remove product from state
      setProducts(products.filter(product => product._id !== productId));
      
      // Show success message if provided
      if (result.message) {
        alert(result.message);
      }
      
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('An error occurred while deleting the product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProduct = async (productData: Partial<IProduct>) => {
    setIsSubmitting(true);
    try {
      if (editingProduct && editingProduct._id) {
        // Update existing product
        const response = await fetch(`/api/products/${editingProduct._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          throw new Error('Failed to update product');
        }

        const updatedProduct = await response.json();
        setProducts(products.map(p => p._id === editingProduct._id ? updatedProduct : p));
      } else {
        // Create new product
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        });

        if (!response.ok) {
          throw new Error('Failed to create product');
        }

        const newProduct = await response.json();
        setProducts([...products, newProduct]);
        
        // Add category to categories list if it's new
        if (!categories.includes(newProduct.category)) {
          setCategories([...categories, newProduct.category]);
        }
      }

      // Close modal after successful save
      setShowAddModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = () => {
    window.location.href = '/dashboard/products/bulk-import';
  };

  const handleViewBarcode = (product: IProduct) => {
    setSelectedProductForBarcode(product);
    setShowBarcodeModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Catalog</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleBulkImport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
            disabled={isSubmitting}
          >
            <FaFileImport /> Bulk Import
          </button>
          <button
            onClick={handleAddProduct}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            <FaPlus /> Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, generic name, SKU, or manufacturer..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={handleSearch}
              disabled={isSubmitting}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={handleCategoryChange}
              disabled={isSubmitting}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
                  <option value="price">Price</option>
                  <option value="category">Category</option>
                  <option value="manufacturer">Manufacturer</option>
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requires Rx
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse flex space-x-4">
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.genericName && (
                        <div className="text-sm text-gray-500 italic">Generic: {product.genericName}</div>
                      )}
                      <div className="text-sm text-gray-500">Mfr: {product.manufacturer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {settings ? formatCurrency(product.price, settings) : product.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.requiresPrescription ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewBarcode(product)}
                        className="text-purple-600 hover:text-purple-900 mr-3"
                        disabled={isSubmitting}
                        title="View Barcode"
                      >
                        <FaBarcode />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        disabled={isSubmitting}
                        title="Edit Product"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id as string)}
                        className="text-red-600 hover:text-red-900"
                        disabled={isSubmitting}
                        title="Delete Product"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No products found. Please add a product or adjust your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 transform transition-all"
            style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <ProductForm
                product={editingProduct}
                onSave={handleSaveProduct}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Barcode View Modal */}
      {showBarcodeModal && selectedProductForBarcode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Product Barcode
              </h2>
              <button
                onClick={() => {
                  setShowBarcodeModal(false);
                  setSelectedProductForBarcode(null);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <BarcodeGenerator
                value={selectedProductForBarcode.sku}
                productName={selectedProductForBarcode.name}
                price={selectedProductForBarcode.price}
                showLabel={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 