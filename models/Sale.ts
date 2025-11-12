import mongoose, { Schema, models } from 'mongoose';

export interface ISaleItem {
  product: mongoose.Types.ObjectId;
  inventory: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  discount: number;
  batchDetails?: {
    batchNumber: string;
    expiryDate: Date;
  };
}

export interface ISale {
  _id?: string;
  customer?: mongoose.Types.ObjectId;
  items: ISaleItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'other';
  hasPrescription: boolean;
  prescription?: {
    doctorName: string;
    prescriptionDate: Date;
    details: string;
  };
  processedBy: mongoose.Types.ObjectId;
  status: 'completed' | 'returned' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const saleItemSchema = new Schema<ISaleItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  inventory: {
    type: Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },
  batchDetails: {
    batchNumber: {
      type: String,
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
  },
});

const saleSchema = new Schema<ISale>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    items: [saleItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile', 'other'],
      default: 'cash',
    },
    hasPrescription: {
      type: Boolean,
      default: false,
    },
    prescription: {
      doctorName: {
        type: String,
        trim: true,
      },
      prescriptionDate: {
        type: Date,
      },
      details: {
        type: String,
        trim: true,
      },
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['completed', 'returned', 'cancelled'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// Add indexes for common queries
saleSchema.index({ createdAt: -1 }); // For date sorting
saleSchema.index({ status: 1 }); // For status filtering
saleSchema.index({ totalAmount: 1 }); // For amount sorting
saleSchema.index({ customer: 1 }); // For customer-specific queries
saleSchema.index({ processedBy: 1 }); // For user-specific queries
saleSchema.index({ paymentMethod: 1 }); // For payment method filtering
saleSchema.index({ createdAt: -1, status: 1 }); // Compound index for recent sales by status
saleSchema.index({ customer: 1, createdAt: -1 }); // Compound index for customer history
saleSchema.index({ totalAmount: 1, createdAt: -1 }); // Compound index for amount and date

const Sale = models.Sale || mongoose.model<ISale>('Sale', saleSchema);

export default Sale; 