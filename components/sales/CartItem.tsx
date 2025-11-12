import React from 'react';
import { FaTrash, FaMinus, FaPlus, FaPrescription } from 'react-icons/fa';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface CartItemProps {
  item: {
    inventory: {
      product: {
        name: string;
        sku: string;
        requiresPrescription?: boolean;
      };
    };
    batch: {
      batchNumber: string;
      expiryDate: string;
      quantity: number;
    } | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  };
  index: number;
  onQuantityChange: (index: number, quantity: number) => void;
  onDiscountChange: (index: number, discount: number) => void;
  onRemove: (index: number) => void;
}

export function CartItemDisplay({
  item,
  index,
  onQuantityChange,
  onDiscountChange,
  onRemove,
}: CartItemProps) {
  const { settings } = useSettings();

  return (
    <div className="bg-white border border-gray-200 rounded-md p-1.5 hover:border-gray-300 transition-colors">
      <div className="grid grid-cols-12 gap-1.5 items-center">
        {/* Product Info - Ultra Compact */}
        <div className="col-span-6">
          <div className="flex items-center gap-1">
            <h4 className="text-xs font-medium text-gray-900 leading-none truncate">{item.inventory.product.name}</h4>
            {item.inventory.product.requiresPrescription && (
              <FaPrescription className="text-red-500 text-xs flex-shrink-0" title="Requires Prescription" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 leading-none mt-0.5">
            <span>{item.inventory.product.sku}</span>
            {item.batch && (
              <span>• {item.batch.batchNumber}</span>
            )}
          </div>
        </div>

        {/* Unit Price - No Label */}
        <div className="col-span-2 text-center">
          <div className="text-xs font-medium text-gray-900">
            {settings ? formatCurrency(item.unitPrice, settings) : `$${item.unitPrice.toFixed(2)}`}
          </div>
        </div>

        {/* Quantity Controls - Inline */}
        <div className="col-span-2">
          <div className="flex items-center justify-center gap-0.5">
            <button
              onClick={() => onQuantityChange(index, Math.max(1, item.quantity - 1))}
              className="w-4 h-4 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-600"
            >
              <FaMinus className="text-xs" />
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => onQuantityChange(index, Math.max(1, parseInt(e.target.value) || 1))}
              className="w-8 text-center text-xs border-0 focus:ring-1 focus:ring-blue-500 rounded px-0.5 h-4"
              min="1"
            />
            <button
              onClick={() => onQuantityChange(index, item.quantity + 1)}
              className="w-4 h-4 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-600"
            >
              <FaPlus className="text-xs" />
            </button>
          </div>
        </div>

        {/* Total & Remove - Inline */}
        <div className="col-span-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <div className="text-xs font-bold text-blue-600">
              {settings ? formatCurrency(item.total, settings) : `$${item.total.toFixed(2)}`}
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700 p-0.5"
              title="Remove item"
            >
              <FaTrash className="text-xs" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 