import { FaTrash, FaPrescription } from 'react-icons/fa';
import { CartItem } from '@/types/sales';
import { formatCurrency } from '@/lib/formatters';
import { Settings } from '@/types/settings';

interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (qty: number) => void;
  onUpdateDiscount: (disc: number) => void;
  onRemove: () => void;
  settings?: Settings;
}

export const CartItemDisplay = ({ 
  item, 
  onUpdateQuantity, 
  onUpdateDiscount, 
  onRemove,
  settings 
}: CartItemProps) => {
  return (
    <div className="p-3 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Product Name and Rx Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {item.inventory.product.name}
            </h3>
            {item.inventory.product.requiresPrescription && (
              <span className="flex-shrink-0 bg-red-50 px-1.5 py-0.5 rounded text-xs font-medium text-red-500">
                Rx
              </span>
            )}
          </div>
          
          {/* Generic Name */}
          {item.inventory.product.genericName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {item.inventory.product.genericName}
            </p>
          )}

          {/* Batch Info */}
          {item.batch && (
            <p className="text-xs text-gray-500 mt-1">
              Batch: {item.batch.batchNumber} | Expires: {new Date(item.batch.expiryDate).toLocaleDateString()}
            </p>
          )}
          
          {/* Price and Quantity Controls */}
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
                className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(parseInt(e.target.value) || 1)}
                className="w-12 text-center border rounded py-0.5 text-sm"
              />
              <button
                onClick={() => onUpdateQuantity(item.quantity + 1)}
                className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">@</span>
              <span className="text-sm font-medium text-gray-700">
                {settings ? formatCurrency(item.unitPrice, settings) : item.unitPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side - Total and Remove */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-500"
            title="Remove item"
          >
            <FaTrash size={14} />
          </button>
          <p className="text-sm font-semibold text-gray-900">
            {settings ? formatCurrency(item.total, settings) : item.total}
          </p>
        </div>
      </div>

      {/* Discount Input */}
      {item.discount > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">Discount:</span>
          <input
            type="number"
            min="0"
            max={item.unitPrice}
            value={item.discount}
            onChange={(e) => onUpdateDiscount(parseFloat(e.target.value) || 0)}
            className="w-20 text-sm border rounded py-0.5 px-1"
          />
        </div>
      )}
    </div>
  );
}; 