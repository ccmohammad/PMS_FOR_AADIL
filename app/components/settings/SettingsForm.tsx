'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface SettingsFormProps {
  activeTab: string;
}

interface BusinessSettings {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber: string;
  taxId: string;
}

interface LocalizationSettings {
  currency: string;
  dateFormat: string;
  timeZone: string;
  language: string;
}

interface InvoiceSettings {
  prefix: string;
  footer: string;
  terms: string;
  showLogo: boolean;
  showSignature: boolean;
}

interface SystemSettings {
  lowStockAlert: number;
  expiryAlert: number;
  backupFrequency: string;
  emailNotifications: boolean;
}

interface Settings {
  business: BusinessSettings;
  localization: LocalizationSettings;
  invoice: InvoiceSettings;
  system: SystemSettings;
}

const defaultSettings: Settings = {
  business: {
    pharmacyName: '',
    address: '',
    phone: '',
    email: '',
    registrationNumber: '',
    taxId: '',
  },
  localization: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'UTC',
    language: 'en',
  },
  invoice: {
    prefix: 'INV',
    footer: 'Thank you for your business!',
    terms: 'Payment is due within 30 days',
    showLogo: true,
    showSignature: true,
  },
  system: {
    lowStockAlert: 10,
    expiryAlert: 30,
    backupFrequency: 'daily',
    emailNotifications: true,
  },
};

export default function SettingsForm({ activeTab }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await axios.get('/api/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings');
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/api/settings', settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClasses = "block text-sm font-medium text-gray-900 mb-1";
  const helperTextClasses = "mt-2 text-sm text-gray-600";
  const checkboxClasses = "h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500";
  const checkboxLabelClasses = "ml-2 block text-sm font-medium text-gray-900";
  const selectClasses = "w-full px-3 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const renderBusinessSettings = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 pb-4 border-b">Business Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClasses}>Pharmacy Name</label>
          <input
            type="text"
            value={settings.business.pharmacyName}
            onChange={(e) => setSettings({
              ...settings,
              business: { ...settings.business, pharmacyName: e.target.value }
            })}
            className={inputClasses}
            placeholder="Enter pharmacy name"
          />
        </div>
        <div>
          <label className={labelClasses}>Registration Number</label>
          <input
            type="text"
            value={settings.business.registrationNumber}
            onChange={(e) => setSettings({
              ...settings,
              business: { ...settings.business, registrationNumber: e.target.value }
            })}
            className={inputClasses}
            placeholder="Enter registration number"
          />
        </div>
        <div>
          <label className={labelClasses}>Phone</label>
          <input
            type="tel"
            value={settings.business.phone}
            onChange={(e) => setSettings({
              ...settings,
              business: { ...settings.business, phone: e.target.value }
            })}
            className={inputClasses}
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label className={labelClasses}>Email</label>
          <input
            type="email"
            value={settings.business.email}
            onChange={(e) => setSettings({
              ...settings,
              business: { ...settings.business, email: e.target.value }
            })}
            className={inputClasses}
            placeholder="Enter email address"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClasses}>Address</label>
          <textarea
            value={settings.business.address}
            onChange={(e) => setSettings({
              ...settings,
              business: { ...settings.business, address: e.target.value }
            })}
            rows={3}
            className={inputClasses}
            placeholder="Enter business address"
          />
        </div>
        <div>
          <label className={labelClasses}>Tax ID</label>
          <input
            type="text"
            value={settings.business.taxId}
            onChange={(e) => setSettings({
              ...settings,
              business: { ...settings.business, taxId: e.target.value }
            })}
            className={inputClasses}
            placeholder="Enter tax ID"
          />
        </div>
      </div>
    </div>
  );

  const renderLocalizationSettings = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 pb-4 border-b">Localization Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClasses}>Currency</label>
          <select
            value={settings.localization.currency}
            onChange={(e) => setSettings({
              ...settings,
              localization: { ...settings.localization, currency: e.target.value }
            })}
            className={selectClasses}
          >
            <option className="text-gray-900" value="USD">USD ($)</option>
            <option className="text-gray-900" value="EUR">EUR (€)</option>
            <option className="text-gray-900" value="GBP">GBP (£)</option>
            <option className="text-gray-900" value="JPY">JPY (¥)</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Date Format</label>
          <select
            value={settings.localization.dateFormat}
            onChange={(e) => setSettings({
              ...settings,
              localization: { ...settings.localization, dateFormat: e.target.value }
            })}
            className={selectClasses}
          >
            <option className="text-gray-900" value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option className="text-gray-900" value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option className="text-gray-900" value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Time Zone</label>
          <select
            value={settings.localization.timeZone}
            onChange={(e) => setSettings({
              ...settings,
              localization: { ...settings.localization, timeZone: e.target.value }
            })}
            className={selectClasses}
          >
            <option className="text-gray-900" value="UTC">UTC</option>
            <option className="text-gray-900" value="EST">EST</option>
            <option className="text-gray-900" value="PST">PST</option>
            <option className="text-gray-900" value="GMT">GMT</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Language</label>
          <select
            value={settings.localization.language}
            onChange={(e) => setSettings({
              ...settings,
              localization: { ...settings.localization, language: e.target.value }
            })}
            className={selectClasses}
          >
            <option className="text-gray-900" value="en">English</option>
            <option className="text-gray-900" value="es">Spanish</option>
            <option className="text-gray-900" value="fr">French</option>
            <option className="text-gray-900" value="de">German</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderInvoiceSettings = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 pb-4 border-b">Invoice Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClasses}>Invoice Prefix</label>
          <input
            type="text"
            value={settings.invoice.prefix}
            onChange={(e) => setSettings({
              ...settings,
              invoice: { ...settings.invoice, prefix: e.target.value }
            })}
            className={inputClasses}
            placeholder="Enter invoice prefix"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClasses}>Invoice Footer</label>
          <textarea
            value={settings.invoice.footer}
            onChange={(e) => setSettings({
              ...settings,
              invoice: { ...settings.invoice, footer: e.target.value }
            })}
            rows={2}
            className={inputClasses}
            placeholder="Enter invoice footer text"
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClasses}>Terms & Conditions</label>
          <textarea
            value={settings.invoice.terms}
            onChange={(e) => setSettings({
              ...settings,
              invoice: { ...settings.invoice, terms: e.target.value }
            })}
            rows={3}
            className={inputClasses}
            placeholder="Enter terms and conditions"
          />
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.invoice.showLogo}
              onChange={(e) => setSettings({
                ...settings,
                invoice: { ...settings.invoice, showLogo: e.target.checked }
              })}
              className={checkboxClasses}
            />
            <label className={checkboxLabelClasses}>Show Logo on Invoice</label>
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.invoice.showSignature}
              onChange={(e) => setSettings({
                ...settings,
                invoice: { ...settings.invoice, showSignature: e.target.checked }
              })}
              className={checkboxClasses}
            />
            <label className={checkboxLabelClasses}>Show Signature Line</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 pb-4 border-b">System Preferences</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClasses}>Low Stock Alert Threshold</label>
          <input
            type="number"
            value={settings.system.lowStockAlert}
            onChange={(e) => setSettings({
              ...settings,
              system: { ...settings.system, lowStockAlert: parseInt(e.target.value) }
            })}
            className={inputClasses}
            min="0"
          />
          <p className={helperTextClasses}>Alert when stock falls below this number</p>
        </div>
        <div>
          <label className={labelClasses}>Expiry Alert Days</label>
          <input
            type="number"
            value={settings.system.expiryAlert}
            onChange={(e) => setSettings({
              ...settings,
              system: { ...settings.system, expiryAlert: parseInt(e.target.value) }
            })}
            className={inputClasses}
            min="0"
          />
          <p className={helperTextClasses}>Alert days before medicine expires</p>
        </div>
        <div>
          <label className={labelClasses}>Backup Frequency</label>
          <select
            value={settings.system.backupFrequency}
            onChange={(e) => setSettings({
              ...settings,
              system: { ...settings.system, backupFrequency: e.target.value }
            })}
            className={selectClasses}
          >
            <option className="text-gray-900" value="daily">Daily</option>
            <option className="text-gray-900" value="weekly">Weekly</option>
            <option className="text-gray-900" value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.system.emailNotifications}
              onChange={(e) => setSettings({
                ...settings,
                system: { ...settings.system, emailNotifications: e.target.checked }
              })}
              className={checkboxClasses}
            />
            <label className={checkboxLabelClasses}>Enable Email Notifications</label>
          </div>
          <p className={helperTextClasses}>Receive alerts via email</p>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'business':
        return renderBusinessSettings();
      case 'localization':
        return renderLocalizationSettings();
      case 'invoice':
        return renderInvoiceSettings();
      case 'system':
        return renderSystemSettings();
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow">
        {renderActiveTab()}
      </div>
      
      <div className="flex items-center justify-end space-x-4 pt-4">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={() => setSettings(defaultSettings)}
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 