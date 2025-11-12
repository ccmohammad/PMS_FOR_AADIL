'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IProduct } from '@/models/Product';
import { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { useSettings } from '@/lib/hooks/useSettings';
import { FaBox, FaTag, FaIndustry, FaBarcode, FaDollarSign, FaPrescription, FaClock } from 'react-icons/fa';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  genericName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().min(0, 'Price must be a positive number'),
  costPrice: z.number().min(0, 'Cost price must be a positive number'),
  requiresPrescription: z.boolean(),
  expiryDateRequired: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product: IProduct | null;
  onSave: (data: Partial<IProduct>) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      ...product,
      price: Number(product.price),
      costPrice: Number(product.costPrice),
      requiresPrescription: product.requiresPrescription || false,
      expiryDateRequired: product.expiryDateRequired || true,
    } : {
      requiresPrescription: false,
      expiryDateRequired: true,
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      sku: '',
      price: 0,
      costPrice: 0,
    },
  });

  // Watch price and cost price for live preview
  const currentPrice = Number(watch('price') || 0);
  const currentCostPrice = Number(watch('costPrice') || 0);
  const margin = currentPrice > 0 && currentCostPrice > 0 
    ? ((currentPrice - currentCostPrice) / currentPrice * 100).toFixed(1)
    : null;

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
      reset();
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (
    name: keyof ProductFormValues,
    label: string,
    type: string = 'text',
    icon: React.ReactNode,
    placeholder?: string,
    disabled?: boolean,
    helperText?: string
  ) => {
    const error = errors[name];
    const inputClasses = `
      w-full px-3 py-2 pl-10 border rounded-lg text-gray-900 bg-white 
      placeholder-gray-400 focus:outline-none focus:ring-2 
      ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'}
      disabled:bg-gray-50 disabled:text-gray-500
      transition-colors duration-200
    `;

    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
          {type === 'textarea' ? (
            <textarea
              {...register(name)}
              placeholder={placeholder}
              rows={3}
              className={inputClasses}
              disabled={disabled}
            />
          ) : (
            <input
              type={type}
              {...register(name, type === 'number' ? { valueAsNumber: true } : undefined)}
              placeholder={placeholder}
              className={inputClasses}
              disabled={disabled}
              step={type === 'number' ? '0.01' : undefined}
              min={type === 'number' ? '0' : undefined}
            />
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error.message}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderField(
              'name',
              'Product Name',
              'text',
              <FaBox />,
              'Enter product name',
              isSubmitting
            )}
            {renderField(
              'genericName',
              'Generic Name',
              'text',
              <FaPrescription />,
              'Enter generic name',
              isSubmitting
            )}
          </div>

          {renderField(
            'description',
            'Description',
            'textarea',
            <FaBox />,
            'Enter product description (optional)',
            isSubmitting
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderField(
              'category',
              'Category',
              'text',
              <FaTag />,
              'Enter product category',
              isSubmitting
            )}
            {renderField(
              'manufacturer',
              'Manufacturer',
              'text',
              <FaIndustry />,
              'Enter manufacturer name',
              isSubmitting
            )}
            {renderField(
              'sku',
              'SKU',
              'text',
              <FaBarcode />,
              'Enter product SKU',
              isSubmitting || !!product?._id,
              'Stock Keeping Unit - Unique identifier for the product'
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {renderField(
                'price',
                'Selling Price',
                'number',
                <FaDollarSign />,
                'Enter selling price',
                isSubmitting
              )}
              {currentPrice > 0 && (
                <div className="mt-1 text-sm text-gray-600">
                  Preview: {formatCurrency(currentPrice, settings)}
                </div>
              )}
            </div>
            <div>
              {renderField(
                'costPrice',
                'Cost Price',
                'number',
                <FaDollarSign />,
                'Enter cost price',
                isSubmitting
              )}
              {currentCostPrice > 0 && (
                <div className="mt-1 text-sm text-gray-600">
                  Preview: {formatCurrency(currentCostPrice, settings)}
                </div>
              )}
            </div>
          </div>
          {margin && (
            <div className="mt-2 text-sm">
              <span className="font-medium text-gray-700">Profit Margin: </span>
              <span className={margin >= 0 ? 'text-green-600' : 'text-red-600'}>
                {margin}%
              </span>
            </div>
          )}
        </div>

        {/* Additional Settings */}
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
              <input
                type="checkbox"
                {...register('requiresPrescription')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-200"
              />
              <div className="flex items-center space-x-3">
                <FaPrescription className="text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Requires Prescription</span>
                  <p className="text-sm text-gray-500">Enable if this product requires a prescription</p>
                </div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors duration-200">
              <input
                type="checkbox"
                {...register('expiryDateRequired')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition duration-200"
              />
              <div className="flex items-center space-x-3">
                <FaClock className="text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-gray-900">Track Expiry Date</span>
                  <p className="text-sm text-gray-500">Enable to track expiry dates for this product</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition duration-200"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {isSubmitting ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </button>
      </div>
    </form>
  );
} 