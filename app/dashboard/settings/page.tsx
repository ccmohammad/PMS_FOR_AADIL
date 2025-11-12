'use client';

import { useState } from 'react';
import { FaStore, FaCog, FaFileInvoice, FaGlobe } from 'react-icons/fa';
import SettingsForm from '@/components/settings/SettingsForm';

const tabs = [
  {
    id: 'business',
    label: 'Business',
    icon: FaStore,
    description: 'Configure your pharmacy business details and contact information',
  },
  {
    id: 'localization',
    label: 'Localization',
    icon: FaGlobe,
    description: 'Set your preferred currency, date format, and language',
  },
  {
    id: 'invoice',
    label: 'Invoice',
    icon: FaFileInvoice,
    description: 'Customize invoice templates and payment terms',
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business');
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your pharmacy system settings and preferences
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex -mb-px space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      focus:outline-none transition-colors duration-200 ease-out
                      ${
                        isActive
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon 
                      className={`
                        mr-2 h-5 w-5 transition-colors duration-200
                        ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              {activeTabData && (
                <>
                  <activeTabData.icon className="h-5 w-5 mr-2 text-gray-500" />
                  {activeTabData.label} Settings
                </>
              )}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {activeTabData?.description}
            </p>
          </div>

          {/* Settings Form */}
          <div className="p-6">
            <SettingsForm activeTab={activeTab} />
          </div>
        </div>
      </div>
    </div>
  );
} 