import mongoose, { Schema, models } from 'mongoose';

export interface IProductBatch {
  _id?: string;
  product: mongoose.Types.ObjectId | string;
  batchNumber: string;
  quantity: number;
  manufacturingDate: Date;
  expiryDate: Date;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  location?: string;
  status: 'active' | 'expired' | 'depleted';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const productBatchSchema = new Schema<IProductBatch>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    manufacturingDate: {
      type: Date,
      required: [true, 'Manufacturing date is required'],
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: 0,
    },
    supplier: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'depleted'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Create individual indexes
productBatchSchema.index({ product: 1, batchNumber: 1 }, { unique: true });
productBatchSchema.index({ expiryDate: 1 });
productBatchSchema.index({ status: 1 });

const ProductBatch = models.ProductBatch || mongoose.model<IProductBatch>('ProductBatch', productBatchSchema);

export default ProductBatch; 