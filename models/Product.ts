import mongoose, { Schema, models } from 'mongoose';

export interface IProduct {
  _id?: string;
  name: string;
  genericName?: string;
  description?: string;
  category: string;
  manufacturer: string;
  sku: string;
  price: number;
  costPrice: number;
  requiresPrescription: boolean;
  expiryDateRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    genericName: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: 0,
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    expiryDateRequired: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Performance indexes for common queries
productSchema.index({ name: 1 }); // For name sorting
productSchema.index({ price: 1 }); // For price sorting
productSchema.index({ category: 1 }); // For category filtering
productSchema.index({ manufacturer: 1 }); // For manufacturer sorting
productSchema.index({ createdAt: -1 }); // For recent products
productSchema.index({ name: 1, category: 1 }); // Compound index for search
productSchema.index({ sku: 1 }); // Already unique, but explicit for queries
productSchema.index({ genericName: 1 }); // For generic name search

const Product = models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product; 