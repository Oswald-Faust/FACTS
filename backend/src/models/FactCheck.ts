/**
 * FACTS Backend - FactCheck Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export type VerdictType = 
  | 'TRUE' 
  | 'FALSE' 
  | 'MISLEADING' 
  | 'NUANCED' 
  | 'AI_GENERATED'
  | 'MANIPULATED'
  | 'UNVERIFIED';

export interface ISource {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedDate?: string;
  trustScore?: number;
}

export interface IVisualAnalysis {
  isAIGenerated: boolean;
  isManipulated: boolean;
  artifacts: string[];
  confidence: number;
  details: string;
}

export interface IFactCheck extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  claim: string;
  verdict: VerdictType;
  confidenceScore: number;
  summary: string;
  analysis: string;
  sources: ISource[];
  visualAnalysis?: IVisualAnalysis;
  imageUrl?: string;
  processingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSchema = new Schema<ISource>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    domain: { type: String, required: true },
    snippet: { type: String, required: true },
    publishedDate: { type: String },
    trustScore: { type: Number, min: 0, max: 100 },
  },
  { _id: false }
);

const VisualAnalysisSchema = new Schema<IVisualAnalysis>(
  {
    isAIGenerated: { type: Boolean, required: true },
    isManipulated: { type: Boolean, required: true },
    artifacts: [{ type: String }],
    confidence: { type: Number, required: true, min: 0, max: 100 },
    details: { type: String, required: true },
  },
  { _id: false }
);

const FactCheckSchema = new Schema<IFactCheck>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    claim: {
      type: String,
      required: true,
      trim: true,
    },
    verdict: {
      type: String,
      enum: ['TRUE', 'FALSE', 'MISLEADING', 'NUANCED', 'AI_GENERATED', 'MANIPULATED', 'UNVERIFIED'],
      required: true,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
      required: true,
    },
    analysis: {
      type: String,
      required: true,
    },
    sources: {
      type: [SourceSchema],
      default: [],
    },
    visualAnalysis: {
      type: VisualAnalysisSchema,
    },
    imageUrl: {
      type: String,
    },
    processingTimeMs: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
FactCheckSchema.index({ userId: 1, createdAt: -1 });
FactCheckSchema.index({ createdAt: -1 });

// Transform output
FactCheckSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const FactCheck = mongoose.model<IFactCheck>('FactCheck', FactCheckSchema);
