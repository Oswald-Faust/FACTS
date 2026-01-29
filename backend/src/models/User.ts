/**
 * FACTS Backend - User Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  plan: 'free' | 'monthly' | 'yearly';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'none';
  dailyRequestsCount: number;
  lastRequestDate: Date;
  premiumExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  revenueCatId?: string;
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
      select: false, // Don't include password in queries by default
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
    plan: {
      type: String,
      enum: ['free', 'monthly', 'yearly'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'past_due', 'canceled', 'none'],
      default: 'none',
    },
    dailyRequestsCount: {
      type: Number,
      default: 0,
    },
    lastRequestDate: {
      type: Date,
      default: Date.now,
    },
    premiumExpiresAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    revenueCatId: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Transform output
UserSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', UserSchema);
