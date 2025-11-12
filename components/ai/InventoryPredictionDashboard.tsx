'use client';

import { useState, useEffect } from 'react';
import { FaChartLine, FaExclamationTriangle, FaShoppingCart, FaClock } from 'react-icons/fa';
import AIAnalysisModal from './AIAnalysisModal';

interface InventoryPrediction {
  productId: string;
  productName: string;
  currentStock: number;
  predictedDemand: number;
  daysUntilStockout: number;
  recommendedReorderQuantity: number;
  confidence: number;
}

export default function InventoryPredictionDashboard() {
  const [predictions, setPredictions] = useState<InventoryPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPredictions = async () => {
    try {
      setShowModal(true);
      setLoading(true);
      setError(null);
      const response = await fetch('/api/ai/inventory-prediction');
      
      if (response.ok) {
        const data = await response.json();
        setPredictions(data.predictions);
        setHasRunAnalysis(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load predictions');
      }
    } catch (err) {
      setError('Error loading predictions. Please check your connection.');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const getPriorityColor = (daysUntilStockout: number) => {
    if (daysUntilStockout <= 7) return 'text-red-600 bg-red-100';
    if (daysUntilStockout <= 14) return 'text-orange-600 bg-orange-100';
    if (daysUntilStockout <= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPriorityIcon = (daysUntilStockout: number) => {
    if (daysUntilStockout <= 7) return <FaExclamationTriangle className="text-red-500" />;
    if (daysUntilStockout <= 14) return <FaClock className="text-orange-500" />;
    return <FaChartLine className="text-green-500" />;
  };


  // Show initial state with run analysis button
  if (!hasRunAnalysis && !loading && !error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <FaChartLine className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Inventory Analysis</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get AI-powered predictions for inventory demand, reorder recommendations, and stock optimization insights.
          </p>
          <button
            onClick={fetchPredictions}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Run AI Analysis
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    const isApiKeyError = error.includes('API key not configured');
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <FaExclamationTriangle className="mx-auto text-4xl mb-2" />
          <p className="mb-4">{error}</p>
          
          {isApiKeyError ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Please configure your OpenAI API key in AI Settings to use this feature.
              </p>
              <a
                href="/dashboard/ai-settings"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Go to AI Settings
              </a>
            </div>
          ) : (
            <button
              onClick={fetchPredictions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const criticalItems = predictions.filter(p => p.daysUntilStockout <= 7);
  const warningItems = predictions.filter(p => p.daysUntilStockout > 7 && p.daysUntilStockout <= 14);

  return (
    <div className="space-y-6">
      {/* Header with Run Again Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Predictions</h2>
          <p className="text-gray-600">AI-powered demand forecasting and reorder recommendations</p>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Run Analysis Again'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="text-red-500" />
            <h3 className="font-semibold text-red-800">Critical Stock</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalItems.length}</p>
          <p className="text-sm text-red-600">Items running out in 7 days</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="text-orange-500" />
            <h3 className="font-semibold text-orange-800">Warning Stock</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{warningItems.length}</p>
          <p className="text-sm text-orange-600">Items running out in 14 days</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaChartLine className="text-blue-500" />
            <h3 className="font-semibold text-blue-800">Total Predictions</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{predictions.length}</p>
          <p className="text-sm text-blue-600">AI-analyzed products</p>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaChartLine className="text-blue-500" />
            AI Inventory Predictions
          </h2>
          <p className="text-gray-600 mt-1">Smart demand forecasting based on sales patterns</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Until Stockout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommended Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions.map((prediction) => (
                <tr key={prediction.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(prediction.daysUntilStockout)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {prediction.productName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prediction.currentStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {prediction.predictedDemand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(prediction.daysUntilStockout)}`}>
                      {prediction.daysUntilStockout} days
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <FaShoppingCart className="text-green-500" />
                      {prediction.recommendedReorderQuantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${prediction.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {predictions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaChartLine className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No predictions available</p>
            <p className="text-sm">AI needs more sales data to generate predictions</p>
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={showModal}
        analysisType="inventory"
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
