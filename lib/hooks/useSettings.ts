'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

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

const fetchSettings = async (): Promise<Settings> => {
  const response = await fetch('/api/settings');
  if (!response.ok) throw new Error('Failed to fetch settings');
  return response.json();
};

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery<Settings, Error>({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const { mutateAsync: updateSettings } = useMutation<Settings, Error, Settings>({
    mutationFn: async (newSettings: Settings) => {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: (data: Settings) => {
      // Update the cache immediately
      queryClient.setQueryData(['settings'], data);
      toast.success('Settings updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    businessName: settings?.business?.pharmacyName || 'Pharmacy MS'
  };
} 