import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGlobalSettings extends Document {
  freeDailyLimit: number;
  premiumDailyLimit: number;
  isMaintenanceMode: boolean;
  minAppVersion: string;
  updatedAt: Date;
}

const GlobalSettingsSchema = new Schema<IGlobalSettings>(
  {
    freeDailyLimit: {
      type: Number,
      default: 10,
    },
    premiumDailyLimit: {
      type: Number,
      default: 0, 
    },
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
    minAppVersion: {
      type: String,
      default: '1.0.0',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overwriting model if already compiled
export const GlobalSettings: Model<IGlobalSettings> = mongoose.models.GlobalSettings || mongoose.model<IGlobalSettings>('GlobalSettings', GlobalSettingsSchema);
