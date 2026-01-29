import mongoose, { Schema, Document } from 'mongoose';

export interface IGlobalSettings extends Document {
  freeDailyLimit: number;
  premiumDailyLimit: number; // 0 or -1 for unlimited
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
      default: 0, // 0 means unlimited
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

export const GlobalSettings = mongoose.model<IGlobalSettings>('GlobalSettings', GlobalSettingsSchema);
