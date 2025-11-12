import mongoose, { Schema, models } from 'mongoose';

export interface ICustomer {
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Add indexes for common queries
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ createdAt: -1 }); // For recent customers
customerSchema.index({ name: 1, phone: 1 }); // Compound index for search
customerSchema.index({ phone: 1, email: 1 }); // Compound index for contact search

const Customer = models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer; 