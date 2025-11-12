import mongoose, { Schema, models } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface User {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

export default models.User || mongoose.model('User', userSchema); 