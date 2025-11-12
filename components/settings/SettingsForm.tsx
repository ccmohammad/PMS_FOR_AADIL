'use client';

import { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import { useSettings } from '@/lib/hooks/useSettings';

interface SettingsFormProps {
  activeTab: string;
}

interface BusinessSettings {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber?: string;
  taxId?: string;
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

interface FormData {
  business: BusinessSettings;
  localization: LocalizationSettings;
  invoice: InvoiceSettings;
}

const DEFAULT_FORM_DATA: FormData = {
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
  }
};

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'BDT', label: 'Bangladeshi Taka (৳)' },
];

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Europe/London', label: 'Europe/London' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bengali' },
];

export default function SettingsForm({ activeTab }: SettingsFormProps) {
  const { settings, isLoading, updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (settings) {
      setFormData({
        ...DEFAULT_FORM_DATA,
        ...settings,
        business: { ...DEFAULT_FORM_DATA.business, ...settings.business },
        localization: { ...DEFAULT_FORM_DATA.localization, ...settings.localization },
        invoice: { ...DEFAULT_FORM_DATA.invoice, ...settings.invoice },
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSettings(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (section: keyof FormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderField = (
    section: keyof FormData,
    field: string,
    label: string,
    type: string = 'text',
    options?: { value: string; label: string }[],
    placeholder?: string,
    helperText?: string
  ) => {
    const value = formData[section][field as keyof typeof formData[typeof section]];
    const inputClasses = "w-full px-3 py-2 border rounded-lg text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200";
    const selectClasses = "w-full px-3 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200";
    
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
        {type === 'select' && options ? (
          <select
            value={value as string}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            className={selectClasses}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
              <textarea
            value={value as string}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className={inputClasses}
          />
        ) : type === 'checkbox' ? (
          <label className="inline-flex items-center mt-1">
              <input
              type="checkbox"
              checked={value as boolean}
              onChange={(e) => handleInputChange(section, field, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-200"
            />
            <span className="ml-2 text-sm text-gray-600">{helperText}</span>
          </label>
        ) : (
              <input
            type={type}
            value={value as string}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            placeholder={placeholder}
            className={inputClasses}
          />
        )}
        {helperText && type !== 'checkbox' && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
    </div>
  );
  };

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderField('business', 'pharmacyName', 'Pharmacy Name', 'text', undefined, 'Enter your pharmacy name')}
        {renderField('business', 'email', 'Email Address', 'email', undefined, 'contact@pharmacy.com')}
            </div>
      {renderField('business', 'address', 'Address', 'textarea', undefined, 'Enter your complete address')}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderField('business', 'phone', 'Phone Number', 'tel', undefined, '+1234567890')}
        {renderField('business', 'registrationNumber', 'Registration Number', 'text', undefined, 'Optional')}
        {renderField('business', 'taxId', 'Tax ID', 'text', undefined, 'Optional')}
      </div>
    </div>
  );

  const renderLocalizationSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderField('localization', 'currency', 'Currency', 'select', CURRENCIES)}
        {renderField('localization', 'dateFormat', 'Date Format', 'select', DATE_FORMATS)}
        {renderField('localization', 'timeZone', 'Time Zone', 'select', TIMEZONES)}
      </div>
    </div>
  );

  const renderInvoiceSettings = () => (
    <div className="space-y-6">
      {renderField('invoice', 'prefix', 'Invoice Prefix', 'text', undefined, 'INV', 'This will be added before invoice numbers')}
      {renderField('invoice', 'footer', 'Invoice Footer', 'textarea', undefined, 'Enter footer text', 'This text will appear at the bottom of your invoices')}
      {renderField('invoice', 'terms', 'Payment Terms', 'textarea', undefined, 'Enter payment terms', 'Specify your payment terms and conditions')}
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
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderActiveTab()}
      
      <div className="flex items-center justify-end space-x-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => setFormData(DEFAULT_FORM_DATA)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
        >
          Reset to Default
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
              <FaSave className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
} 