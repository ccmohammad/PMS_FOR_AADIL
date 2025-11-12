import mongoose, { Schema, models } from 'mongoose';

export interface IInventory {
  _id?: string;
  product: mongoose.Types.ObjectId;
  batch: string;
  quantity: number;
  expiryDate?: Date;
  location: string;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    batch: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    location: {
      type: String,
      required: [true, 'Storage location is required'],
      trim: true,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: 0,
    },
  },
  { timestamps: true }
);

// Compound index for product and batch
inventorySchema.index({ product: 1, batch: 1 }, { unique: true });

// Performance indexes for common queries
inventorySchema.index({ quantity: 1, reorderLevel: 1 }); // For low stock queries
inventorySchema.index({ expiryDate: 1 }); // For expiry date queries
inventorySchema.index({ location: 1 }); // For location-based queries
inventorySchema.index({ createdAt: -1 }); // For recent items
inventorySchema.index({ product: 1, quantity: 1 }); // For product-quantity queries
inventorySchema.index({ product: 1, expiryDate: 1 }); // For product-expiry queries

const Inventory = models.Inventory || mongoose.model<IInventory>('Inventory', inventorySchema);

export default Inventory; 