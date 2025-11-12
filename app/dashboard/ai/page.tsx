'use client';

import { useState } from 'react';
import { FaRobot, FaChartLine, FaClock, FaExclamationTriangle, FaSearch, FaCamera, FaPills } from 'react-icons/fa';
import InventoryPredictionDashboard from '@/components/ai/InventoryPredictionDashboard';
import ExpiryManagementDashboard from '@/components/ai/ExpiryManagementDashboard';

export default function AIDashboard() {
  const [activeTab, setActiveTab] = useState('predictions');

  const tabs = [
    {
      id: 'predictions',
      name: 'Inventory Predictions',
      icon: <FaChartLine className="w-5 h-5" />,
      description: 'AI-powered demand forecasting and reorder recommendations'
    },
    {
      id: 'expiry',
      name: 'Expiry Management',
      icon: <FaClock className="w-5 h-5" />,
      description: 'Smart expiry alerts and disposal recommendations'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <FaRobot className="text-2xl text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Analytics</h1>
              <p className="text-gray-600">Intelligent pharmacy management powered by AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaChartLine className="text-2xl text-blue-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Smart Inventory Predictions</h2>
                  <p className="text-gray-600">AI analyzes your sales patterns to predict future demand and suggest optimal reorder quantities</p>
                </div>
              </div>
              <InventoryPredictionDashboard />
            </div>
          </div>
        )}

        {activeTab === 'expiry' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaClock className="text-2xl text-orange-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Smart Expiry Management</h2>
                  <p className="text-gray-600">AI-powered recommendations for managing expiring medications and optimizing inventory rotation</p>
                </div>
              </div>
              <ExpiryManagementDashboard />
            </div>
          </div>
        )}
      </div>

      {/* AI Features Overview */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Available AI Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaExclamationTriangle className="text-red-500" />
                <h4 className="font-medium text-gray-900">Drug Interaction Checker</h4>
              </div>
              <p className="text-sm text-gray-600">Automatically detects dangerous drug interactions during sales processing</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaSearch className="text-blue-500" />
                <h4 className="font-medium text-gray-900">AI Product Search</h4>
              </div>
              <p className="text-sm text-gray-600">Natural language search for products using symptoms and medical conditions</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaCamera className="text-purple-500" />
                <h4 className="font-medium text-gray-900">Prescription Processing</h4>
              </div>
              <p className="text-sm text-gray-600">OCR and AI to extract prescription details from images</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaPills className="text-green-500" />
                <h4 className="font-medium text-gray-900">Medication Substitution</h4>
              </div>
              <p className="text-sm text-gray-600">AI-powered generic alternatives and cost savings recommendations</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaChartLine className="text-green-500" />
                <h4 className="font-medium text-gray-900">Inventory Predictions</h4>
              </div>
              <p className="text-sm text-gray-600">Predict demand and suggest optimal reorder quantities</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaClock className="text-orange-500" />
                <h4 className="font-medium text-gray-900">Expiry Management</h4>
              </div>
              <p className="text-sm text-gray-600">Smart alerts and recommendations for expiring medications</p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaRobot className="text-indigo-500" />
                <h4 className="font-medium text-gray-900">More Coming Soon</h4>
              </div>
              <p className="text-sm text-gray-600">Additional AI features are being developed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
