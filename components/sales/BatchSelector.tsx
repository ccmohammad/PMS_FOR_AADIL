import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface Batch {
  _id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  sellingPrice: number;
  status: 'active' | 'expired' | 'depleted';
}

interface BatchSelectorProps {
  productId: string;
  onBatchSelect: (batch: Batch | null) => void;
  selectedQuantity?: number;
}

export function BatchSelector({
  productId,
  onBatchSelect,
  selectedQuantity = 1,
}: BatchSelectorProps) {
  const { settings } = useSettings();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/product-batches?productId=${productId}&status=active`
        );
        if (!response.ok) throw new Error('Failed to fetch batches');
        const data = await response.json();
        
        // Sort by FEFO (First Expiry, First Out)
        const sortedBatches = data.sort((a: Batch, b: Batch) => 
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
        
        setBatches(sortedBatches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching batches');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchBatches();
    }
  }, [productId]);

  const getBatchStatus = (batch: Batch): 'expired' | 'near-expiry' | 'insufficient' | 'available' => {
    const today = new Date();
    const expiryDate = new Date(batch.expiryDate);
    const monthsUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (monthsUntilExpiry <= 0) return 'expired';
    if (monthsUntilExpiry <= 3) return 'near-expiry';
    if (batch.quantity < selectedQuantity) return 'insufficient';
    return 'available';
  };

  const getStatusBadge = (status: 'expired' | 'near-expiry' | 'insufficient' | 'available'): string => {
    const variants: Record<string, string> = {
      expired: 'bg-red-100 text-red-800',
      'near-expiry': 'bg-yellow-100 text-yellow-800',
      insufficient: 'bg-orange-100 text-orange-800',
      available: 'bg-green-100 text-green-800',
    };

    return variants[status] || '';
  };

  if (loading) return <div>Loading batches...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (batches.length === 0) {
    return <div className="text-yellow-500">No active batches available</div>;
  }

  return (
    <Select
      onValueChange={(value: string) => {
        const selectedBatch = batches.find((b) => b._id === value);
        onBatchSelect(selectedBatch || null);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select batch" />
      </SelectTrigger>
      <SelectContent>
        {batches.map((batch) => {
          const status = getBatchStatus(batch);
          const isDisabled =
            status === 'expired' || status === 'insufficient';

          return (
            <SelectItem
              key={batch._id}
              value={batch._id}
              disabled={isDisabled}
              className="flex flex-col gap-1 py-2"
            >
              <div className="flex items-center justify-between">
                <span>Batch: {batch.batchNumber}</span>
                <Badge className={getStatusBadge(status)}>
                  {status.replace('-', ' ')}
                </Badge>
              </div>
              <div className="text-sm text-gray-500">
                Qty: {batch.quantity} | Expires: {formatDate(batch.expiryDate, settings)} |
                Price: {formatCurrency(batch.sellingPrice, settings)}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
} 