import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string;
  displayName?: string;
  photoUrl?: string;
  provider: 'email' | 'google' | 'apple';
  providerId?: string;
  factChecksCount: number;
  isPremium: boolean;
  premiumExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    displayName: {
      type: String,
      trim: true,
    },
    photoUrl: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['email', 'google', 'apple'],
      default: 'email',
    },
    providerId: {
      type: String,
    },
    factChecksCount: {
      type: Number,
      default: 0,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to check if model exists to avoid recompilation errors in Next.js
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
