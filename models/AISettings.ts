import mongoose, { Schema, models } from 'mongoose';

export interface IAISettings {
  _id?: string;
  openaiApiKey: string;
  enableDrugInteractions: boolean;
  enableInventoryPredictions: boolean;
  enableProductSearch: boolean;
  enableExpiryManagement: boolean;
  enablePrescriptionProcessing: boolean;
  enableMedicationSubstitution: boolean;
  interactionSeverityThreshold: 'minor' | 'moderate' | 'major' | 'severe';
  createdAt: Date;
  updatedAt: Date;
}

const aiSettingsSchema = new Schema<IAISettings>(
  {
    openaiApiKey: {
      type: String,
      required: true,
      trim: true,
    },
    enableDrugInteractions: {
      type: Boolean,
      default: true,
    },
    enableInventoryPredictions: {
      type: Boolean,
      default: true,
    },
    enableProductSearch: {
      type: Boolean,
      default: true,
    },
    enableExpiryManagement: {
      type: Boolean,
      default: true,
    },
    enablePrescriptionProcessing: {
      type: Boolean,
      default: true,
    },
    enableMedicationSubstitution: {
      type: Boolean,
      default: true,
    },
    interactionSeverityThreshold: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'severe'],
      default: 'moderate',
    },
  },
  { timestamps: true }
);

const AISettings = models.AISettings || mongoose.model<IAISettings>('AISettings', aiSettingsSchema);

export default AISettings;
