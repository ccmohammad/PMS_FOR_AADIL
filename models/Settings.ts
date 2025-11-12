import mongoose, { Schema, models } from 'mongoose';

const settingsSchema = new Schema({
  business: {
    pharmacyName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    registrationNumber: { type: String, required: false },
    taxId: { type: String, required: false },
  },
  localization: {
    currency: { type: String, default: 'USD' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeZone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
  },
  invoice: {
    prefix: { type: String, default: 'INV' },
    footer: { type: String, default: 'Thank you for your business!' },
    terms: { type: String, default: 'Payment is due within 30 days' },
    showLogo: { type: Boolean, default: true },
    showSignature: { type: Boolean, default: true },
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
});

const Settings = models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings; 