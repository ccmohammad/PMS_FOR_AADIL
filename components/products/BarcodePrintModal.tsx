'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import JsBarcode from 'jsbarcode';
import { FaTimes, FaPrint } from 'react-icons/fa';
import { IProduct } from '@/models/Product';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';

interface BarcodePrintModalProps {
  products: IProduct[];
  onClose: () => void;
}

interface BarcodeLabelProps {
  product: IProduct;
  showPrice?: boolean;
  showName?: boolean;
  labelSize?: 'small' | 'medium' | 'large';
}

const BarcodeLabel = ({ product, showPrice = true, showName = true, labelSize = 'medium' }: BarcodeLabelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();

  // Generate barcode on mount
  useEffect(() => {
    if (canvasRef.current && product.sku) {
      try {
        const dimensions = {
          small: { width: 1.5, height: 50, fontSize: 10 },
          medium: { width: 2, height: 75, fontSize: 12 },
          large: { width: 2.5, height: 100, fontSize: 14 }
        };

        const dim = dimensions[labelSize];

        JsBarcode(canvasRef.current, product.sku, {
          format: 'CODE128',
          width: dim.width,
          height: dim.height,
          displayValue: true,
          fontSize: dim.fontSize,
          margin: 5,
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
      }
    }
  }, [product.sku, labelSize]);

  return (
    <div className={`barcode-label ${labelSize}`}>
      {showName && <div className="product-name">{product.name}</div>}
      <canvas ref={canvasRef} className="barcode-canvas" />
      {showPrice && <div className="product-price">{settings ? formatCurrency(product.price || 0, settings) : `$${product.price?.toFixed(2) || '0.00'}`}</div>}
    </div>
  );
};

export function BarcodePrintModal({ products, onClose }: BarcodePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(products.filter(p => p._id).map(p => p._id!))
  );
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [labelSize, setLabelSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [copiesPerProduct, setCopiesPerProduct] = useState(1);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        body {
          margin: 0;
        }
        .barcode-label {
          break-inside: avoid;
          display: inline-block;
          text-align: center;
          border: 1px solid #ddd;
          padding: 8px;
          margin: 4px;
        }
        .barcode-label.small {
          width: 2in;
          height: 1in;
        }
        .barcode-label.medium {
          width: 2.5in;
          height: 1.5in;
        }
        .barcode-label.large {
          width: 3in;
          height: 2in;
        }
        .product-name {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .product-price {
          font-size: 14px;
          font-weight: bold;
          margin-top: 4px;
        }
        .barcode-canvas {
          max-width: 100%;
          height: auto;
        }
      }
    `,
  });

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleAll = () => {
    if (selectedProducts.size === products.filter(p => p._id).length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.filter(p => p._id).map(p => p._id!)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Print Barcode Labels</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-3">Label Options</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showName}
                    onChange={(e) => setShowName(e.target.checked)}
                    className="mr-2"
                  />
                  Show Product Name
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={(e) => setShowPrice(e.target.checked)}
                    className="mr-2"
                  />
                  Show Price
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">Label Size</label>
                  <select
                    value={labelSize}
                    onChange={(e) => setLabelSize(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="small">Small (2" x 1")</option>
                    <option value="medium">Medium (2.5" x 1.5")</option>
                    <option value="large">Large (3" x 2")</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Copies per Product</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={copiesPerProduct}
                    onChange={(e) => setCopiesPerProduct(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Select Products</h4>
              <div className="border rounded-md max-h-64 overflow-y-auto">
                <label className="flex items-center p-3 border-b hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === products.filter(p => p._id).length}
                    onChange={toggleAll}
                    className="mr-3"
                  />
                  <span className="font-medium">Select All</span>
                </label>
                {products.map((product) => (
                  <label
                    key={product._id}
                    className="flex items-center p-3 border-b hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product._id!)}
                      onChange={() => toggleProduct(product._id!)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-md p-4 bg-gray-50">
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="flex flex-wrap gap-4">
              {products
                .filter(p => selectedProducts.has(p._id!))
                .slice(0, 3)
                .map((product) => (
                  <BarcodeLabel
                    key={product._id}
                    product={product}
                    showPrice={showPrice}
                    showName={showName}
                    labelSize={labelSize}
                  />
                ))}
              {selectedProducts.size > 3 && (
                <div className="flex items-center text-gray-500">
                  <span>+{selectedProducts.size - 3} more...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            disabled={selectedProducts.size === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <FaPrint />
            Print {selectedProducts.size} Labels
          </button>
        </div>

        {/* Hidden print content */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            {products
              .filter(p => selectedProducts.has(p._id!))
              .map((product) => 
                Array.from({ length: copiesPerProduct }, (_, i) => (
                  <BarcodeLabel
                    key={`${product._id}-${i}`}
                    product={product}
                    showPrice={showPrice}
                    showName={showName}
                    labelSize={labelSize}
                  />
                ))
              )
              .flat()}
          </div>
        </div>
      </div>
    </div>
  );
} 