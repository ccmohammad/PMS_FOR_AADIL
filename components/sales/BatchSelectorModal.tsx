import React from 'react';
import { BatchSelector } from './BatchSelector';
import { IProduct } from '@/models/Product';

interface BatchSelectorModalProps {
  product: IProduct;
  onBatchSelect: (batch: any) => void;
  onClose: () => void;
}

export function BatchSelectorModal({
  product,
  onBatchSelect,
  onClose
}: BatchSelectorModalProps) {
  if (!product._id) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          Select Batch for {product.name}
        </h2>
        <BatchSelector
          productId={product._id}
          onBatchSelect={onBatchSelect}
          selectedQuantity={1}
        />
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 