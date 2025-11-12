import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

interface Settings {
  business: {
    pharmacyName: string;
    address: string;
    phone: string;
    email: string;
    registrationNumber?: string;
    taxId?: string;
  };
  localization: {
    currency: string;
    dateFormat: string;
    timeZone: string;
    language: string;
  };
  invoice: {
    prefix: string;
    footer: string;
    terms: string;
    showLogo: boolean;
    showSignature: boolean;
  };
}

const DEFAULT_CURRENCY = 'USD';
const DEFAULT_DATE_FORMAT = 'MM/DD/YYYY';
const DEFAULT_TIMEZONE = 'UTC';

const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BDT: '৳',
};

export function formatCurrency(amount: number | undefined | null, settings: Settings): string {
  if (amount === undefined || amount === null) {
    amount = 0;
  }
  
  const currency = settings?.localization?.currency || DEFAULT_CURRENCY;
  const symbol = currencySymbols[currency] || currency;
  const formattedAmount = Number(amount).toFixed(2);

  return `${symbol}${formattedAmount}`;
}

export function formatDate(
  date: string | Date,
  settings?: Settings
): string {
  // Use UTC timezone for consistent server/client rendering
  const format = settings?.localization?.dateFormat || DEFAULT_DATE_FORMAT;

  // Convert format from MM/DD/YYYY to dayjs format if needed
  const formatMap: { [key: string]: string } = {
    'MM/DD/YYYY': 'MM/DD/YYYY',
    'DD/MM/YYYY': 'DD/MM/YYYY',
    'YYYY-MM-DD': 'YYYY-MM-DD',
  };

  const dayjsFormat = formatMap[format] || DEFAULT_DATE_FORMAT;

  // Always use UTC to prevent hydration mismatches
  return dayjs(date)
    .utc()
    .format(dayjsFormat);
}

export function formatDateTime(
  date: string | Date,
  settings?: Settings
): string {
  const format = settings?.localization?.dateFormat || DEFAULT_DATE_FORMAT;
  const formatMap: { [key: string]: string } = {
    'MM/DD/YYYY': 'MM/DD/YYYY HH:mm:ss',
    'DD/MM/YYYY': 'DD/MM/YYYY HH:mm:ss',
    'YYYY-MM-DD': 'YYYY-MM-DD HH:mm:ss',
  };

  const dayjsFormat = formatMap[format] || `${DEFAULT_DATE_FORMAT} HH:mm:ss`;

  // Always use UTC to prevent hydration mismatches
  return dayjs(date)
    .utc()
    .format(dayjsFormat);
}

// Function to get settings from API
export async function getSettings(): Promise<Settings> {
  try {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings
    return {
      business: {
        pharmacyName: 'Your Pharmacy',
        address: '123 Pharmacy Street',
        phone: '(123) 456-7890',
        email: 'contact@yourpharmacy.com',
      },
      localization: {
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'UTC',
        language: 'en',
      },
      invoice: {
        prefix: '',
        footer: '',
        terms: '',
        showLogo: false,
        showSignature: false,
      },
    };
  }
} 