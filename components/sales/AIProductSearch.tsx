'use client';

import { useState } from 'react';
import { FaSearch, FaRobot, FaSpinner } from 'react-icons/fa';

interface ProductSearchResult {
  _id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer: string;
  sku: string;
  price: number;
  requiresPrescription: boolean;
  relevanceScore: number;
  searchReason: string;
}

interface AIProductSearchProps {
  onProductSelect: (product: ProductSearchResult) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIProductSearch({ onProductSelect, isOpen, onClose }: AIProductSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/ai/product-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        
        // Add to search history
        if (!searchHistory.includes(query)) {
          setSearchHistory(prev => [query, ...prev.slice(0, 4)]);
        }
      }
    } catch (error) {
      console.error('AI search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleProductClick = (product: ProductSearchResult) => {
    onProductSelect(product);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaRobot className="text-blue-500" />
              AI Product Search
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by symptoms, medication names, or conditions..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSearching ? <FaSpinner className="animate-spin" /> : <FaSearch />}
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Searches:</h3>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((product) => (
                <div
                  key={product._id}
                  onClick={() => handleProductClick(product)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-600">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.requiresPrescription && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                          Rx Required
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {product.genericName && (
                    <p className="text-sm text-gray-600 mb-1">
                      Generic: {product.genericName}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                    <span>Category: {product.category}</span>
                    <span>Manufacturer: {product.manufacturer}</span>
                    <span>SKU: {product.sku}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-600 italic">
                      {product.searchReason}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${product.relevanceScore * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(product.relevanceScore * 100)}% match
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query && !isSearching ? (
            <div className="text-center text-gray-500 py-8">
              <FaSearch className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>No products found for "{query}"</p>
              <p className="text-sm">Try different keywords or symptoms</p>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <FaRobot className="mx-auto text-4xl mb-4 text-gray-300" />
              <p>Search for products using natural language</p>
              <p className="text-sm">Examples: "headache medicine", "blood pressure medication", "cough syrup"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
