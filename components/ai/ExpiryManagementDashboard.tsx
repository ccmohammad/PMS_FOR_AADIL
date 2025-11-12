'use client';

import { useState, useEffect } from 'react';
import { FaExclamationTriangle, FaClock, FaCheckCircle, FaTrash, FaTag, FaArrowRight } from 'react-icons/fa';
import AIAnalysisModal from './AIAnalysisModal';

interface ExpiryAlert {
  productId: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  suggestedAction: 'use_first' | 'discount' | 'return' | 'dispose';
}

export default function ExpiryManagementDashboard() {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchExpiryAlerts = async () => {
    try {
      setShowModal(true);
      setLoading(true);
      setError(null);
      const response = await fetch('/api/ai/expiry-management');
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
        setHasRunAnalysis(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load expiry alerts');
      }
    } catch (err) {
      setError('Error loading expiry alerts. Please check your connection.');
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'use_first': return <FaArrowRight className="text-blue-500" />;
      case 'discount': return <FaTag className="text-orange-500" />;
      case 'return': return <FaArrowRight className="text-yellow-500" />;
      case 'dispose': return <FaTrash className="text-red-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'use_first': return 'Use First';
      case 'discount': return 'Apply Discount';
      case 'return': return 'Return to Supplier';
      case 'dispose': return 'Safe Disposal';
      default: return 'Review';
    }
  };


  // Show initial state with run analysis button
  if (!hasRunAnalysis && !loading && !error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <FaClock className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Expiry Management</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get AI-powered recommendations for managing expiring medications, optimizing inventory rotation, and reducing waste.
          </p>
          <button
            onClick={fetchExpiryAlerts}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
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
              onClick={fetchExpiryAlerts}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.priority === 'critical');
  const highAlerts = alerts.filter(a => a.priority === 'high');
  const mediumAlerts = alerts.filter(a => a.priority === 'medium');
  const lowAlerts = alerts.filter(a => a.priority === 'low');

  return (
    <div className="space-y-6">
      {/* Header with Run Again Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expiry Management</h2>
          <p className="text-gray-600">AI-powered recommendations for managing expiring medications</p>
        </div>
        <button
          onClick={fetchExpiryAlerts}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Run Analysis Again'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaExclamationTriangle className="text-red-500" />
            <h3 className="font-semibold text-red-800">Critical</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
          <p className="text-sm text-red-600">Expiring within 7 days</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="text-orange-500" />
            <h3 className="font-semibold text-orange-800">High Priority</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{highAlerts.length}</p>
          <p className="text-sm text-orange-600">Expiring within 14 days</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaClock className="text-yellow-500" />
            <h3 className="font-semibold text-yellow-800">Medium</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{mediumAlerts.length}</p>
          <p className="text-sm text-yellow-600">Expiring within 30 days</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FaCheckCircle className="text-green-500" />
            <h3 className="font-semibold text-green-800">Low Priority</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{lowAlerts.length}</p>
          <p className="text-sm text-green-600">Expiring in 30+ days</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaClock className="text-blue-500" />
            Smart Expiry Management
          </h2>
          <p className="text-gray-600 mt-1">AI-powered recommendations for expiring medications</p>
        </div>

        <div className="divide-y divide-gray-200">
          {alerts.map((alert) => (
            <div key={`${alert.productId}-${alert.batchNumber}`} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {alert.productName}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Batch Number</p>
                      <p className="font-medium">{alert.batchNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="font-medium">{new Date(alert.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Days Until Expiry</p>
                      <p className="font-medium text-lg">{alert.daysUntilExpiry} days</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">
                      <strong>AI Recommendation:</strong> {alert.recommendation}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getActionIcon(alert.suggestedAction)}
                      <span className="text-sm font-medium text-gray-700">
                        Suggested Action: {getActionText(alert.suggestedAction)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FaCheckCircle className="mx-auto text-4xl mb-2 text-gray-300" />
            <p>No expiry alerts</p>
            <p className="text-sm">All medications have good shelf life remaining</p>
          </div>
        )}
      </div>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        isOpen={showModal}
        analysisType="expiry"
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
