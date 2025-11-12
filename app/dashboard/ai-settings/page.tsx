'use client';

import { useState, useEffect } from 'react';
import { FaRobot, FaKey, FaSave, FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useToast } from '@/components/ui/Toast';

interface AISettings {
  openaiApiKey: string;
  enableDrugInteractions: boolean;
  enableInventoryPredictions: boolean;
  enableProductSearch: boolean;
  enableExpiryManagement: boolean;
  enablePrescriptionProcessing: boolean;
  // enableMedicationSubstitution: boolean; // Disabled to reduce costs
  interactionSeverityThreshold: 'minor' | 'moderate' | 'major' | 'severe';
}

export default function AISettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AISettings>({
    openaiApiKey: '',
    enableDrugInteractions: true,
    enableInventoryPredictions: true,
    enableProductSearch: true,
    enableExpiryManagement: true,
    enablePrescriptionProcessing: true,
    // enableMedicationSubstitution: true, // Disabled to reduce costs
    interactionSeverityThreshold: 'moderate'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/ai/settings');
      if (response.ok) {
        const data = await response.json();
        // Ensure all fields have default values to prevent controlled/uncontrolled input errors
        const loadedSettings = {
          openaiApiKey: data.settings.openaiApiKey || '',
          enableDrugInteractions: Boolean(data.settings.enableDrugInteractions),
          enableInventoryPredictions: Boolean(data.settings.enableInventoryPredictions),
          enableProductSearch: Boolean(data.settings.enableProductSearch),
          enableExpiryManagement: Boolean(data.settings.enableExpiryManagement),
          enablePrescriptionProcessing: Boolean(data.settings.enablePrescriptionProcessing),
          enableMedicationSubstitution: data.settings.enableMedicationSubstitution === undefined || data.settings.enableMedicationSubstitution === false ? true : Boolean(data.settings.enableMedicationSubstitution), // Force to true if undefined or false
          interactionSeverityThreshold: data.settings.interactionSeverityThreshold || 'moderate'
        };
        
        console.log('AI Settings: Raw data from API:', data.settings);
        console.log('AI Settings: enableMedicationSubstitution from API:', data.settings.enableMedicationSubstitution);
        console.log('AI Settings: Processed settings:', loadedSettings);
        console.log('AI Settings: enableMedicationSubstitution processed:', loadedSettings.enableMedicationSubstitution);
        
        setSettings(loadedSettings);
        
        // Auto-save if medication substitution was forced to true
        if ((data.settings.enableMedicationSubstitution === false || data.settings.enableMedicationSubstitution === undefined) && loadedSettings.enableMedicationSubstitution === true) {
          console.log('AI Settings: Auto-saving settings to fix medication substitution...');
          setTimeout(() => {
            handleSave();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving AI settings:', settings);
      
      const response = await fetch('/api/ai/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Settings saved successfully:', result);
        showToast('AI settings saved successfully', 'success');
      } else {
        const error = await response.json();
        console.error('Failed to save settings:', error);
        showToast('Failed to save AI settings', 'error');
      }
    } catch (error) {
      console.error('Error saving AI settings:', error);
      showToast('Error saving AI settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!settings.openaiApiKey) {
      showToast('Please enter an OpenAI API key first', 'error');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch('/api/ai/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: settings.openaiApiKey }),
      });

      if (response.ok) {
        setConnectionStatus('success');
        showToast('OpenAI connection successful!', 'success');
      } else {
        setConnectionStatus('error');
        showToast('OpenAI connection failed. Please check your API key.', 'error');
      }
    } catch (error) {
      setConnectionStatus('error');
      showToast('Error testing connection', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleInputChange = (field: keyof AISettings, value: any) => {
    console.log(`Updating ${field} to:`, value);
    console.log('Current settings before update:', settings);
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [field]: value
      };
      console.log('New settings state:', newSettings);
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <FaRobot className="text-2xl text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
              <p className="text-gray-600">Configure AI features and OpenAI API integration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* OpenAI API Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaKey className="text-xl text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">OpenAI API Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={settings.openaiApiKey}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={testConnection}
                    disabled={testingConnection || !settings.openaiApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {testingConnection ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <FaCheck />
                    )}
                    Test
                  </button>
                </div>
                
                {/* Connection Status */}
                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-2 mt-2 text-green-600">
                    <FaCheck className="text-sm" />
                    <span className="text-sm">Connection successful</span>
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <FaExclamationTriangle className="text-sm" />
                    <span className="text-sm">Connection failed</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">How to get your OpenAI API key:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com/api-keys</a></li>
                      <li>Sign in to your OpenAI account</li>
                      <li>Click "Create new secret key"</li>
                      <li>Copy the key and paste it above</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Features Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaRobot className="text-xl text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900">AI Features</h2>
            </div>
            
            <div className="space-y-4">
              {[
                {
                  key: 'enableDrugInteractions',
                  title: 'Drug Interaction Checker',
                  description: 'Automatically check for dangerous drug interactions during sales',
                  icon: <FaExclamationTriangle className="text-red-500" />
                },
                {
                  key: 'enableInventoryPredictions',
                  title: 'Inventory Predictions',
                  description: 'AI-powered demand forecasting and reorder recommendations',
                  icon: <FaCheck className="text-green-500" />
                },
                {
                  key: 'enableProductSearch',
                  title: 'AI Product Search',
                  description: 'Natural language search for products using symptoms and conditions',
                  icon: <FaCheck className="text-blue-500" />
                },
                {
                  key: 'enableExpiryManagement',
                  title: 'Smart Expiry Management',
                  description: 'AI-powered expiry alerts and disposal recommendations',
                  icon: <FaCheck className="text-orange-500" />
                },
                {
                  key: 'enablePrescriptionProcessing',
                  title: 'Prescription Processing',
                  description: 'OCR and AI to extract prescription details from images',
                  icon: <FaCheck className="text-purple-500" />
                },
                {
                  key: 'enableMedicationSubstitution',
                  title: 'Medication Substitution',
                  description: 'AI-powered generic alternatives and cost savings recommendations',
                  icon: <FaCheck className="text-green-500" />
                }
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {feature.icon}
                    <div>
                      <h3 className="font-medium text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(settings[feature.key as keyof AISettings])}
                      onChange={(e) => {
                        console.log(`Checkbox changed for ${feature.key}:`, e.target.checked);
                        handleInputChange(feature.key as keyof AISettings, e.target.checked);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drug Interaction Severity Threshold
                </label>
                <select
                  value={settings.interactionSeverityThreshold}
                  onChange={(e) => handleInputChange('interactionSeverityThreshold', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="minor">Minor - Show all interactions</option>
                  <option value="moderate">Moderate - Show moderate and above</option>
                  <option value="major">Major - Show major and severe only</option>
                  <option value="severe">Severe - Show severe only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only show interactions at or above this severity level
                </p>
              </div>
            </div>
          </div>

          {/* Debug Section - Remove in production */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove in production)</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>enableMedicationSubstitution: {String(settings.enableMedicationSubstitution)}</p>
              <p>All settings: {JSON.stringify(settings, null, 2)}</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <FaSave />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
