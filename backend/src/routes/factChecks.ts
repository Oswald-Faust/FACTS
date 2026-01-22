/**
 * FACTS Backend - FactCheck Routes
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FactCheck, User } from '../models';
import { authenticate, AuthRequest, createError } from '../middleware';

const router = Router();

// Validation schemas
const createFactCheckSchema = z.object({
  claim: z.string().min(1, 'La claim est requise'),
  verdict: z.enum(['TRUE', 'FALSE', 'MISLEADING', 'NUANCED', 'AI_GENERATED', 'MANIPULATED', 'UNVERIFIED']),
  confidenceScore: z.number().min(0).max(100),
  summary: z.string().min(1, 'Le résumé est requis'),
  analysis: z.string().min(1, 'L\'analyse est requise'),
  sources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    domain: z.string(),
    snippet: z.string(),
    publishedDate: z.string().optional(),
    trustScore: z.number().min(0).max(100).optional(),
  })).default([]),
  visualAnalysis: z.object({
    isAIGenerated: z.boolean(),
    isManipulated: z.boolean(),
    artifacts: z.array(z.string()),
    confidence: z.number().min(0).max(100),
    details: z.string(),
  }).optional(),
  imageUrl: z.string().url().optional(),
  processingTimeMs: z.number(),
});

/**
 * GET /api/fact-checks
 * Get all fact-checks for the authenticated user
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    const [factChecks, total] = await Promise.all([
      FactCheck.find({ userId: req.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FactCheck.countDocuments({ userId: req.userId }),
    ]);

    res.json({
      success: true,
      data: {
        factChecks: factChecks.map(fc => ({
          ...fc,
          id: fc._id.toString(),
          _id: undefined,
          __v: undefined,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fact-checks/:id
 * Get a specific fact-check by ID
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const factCheck = await FactCheck.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!factCheck) {
      throw createError('Fact-check non trouvé', 404);
    }

    res.json({
      success: true,
      data: {
        factCheck: factCheck.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/fact-checks
 * Create a new fact-check (save result)
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createFactCheckSchema.parse(req.body);

    const factCheck = new FactCheck({
      userId: req.userId,
      ...data,
    });

    await factCheck.save();

    // Update user's fact check count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { factChecksCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'Fact-check enregistré',
      data: {
        factCheck: factCheck.toJSON(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/fact-checks/:id
 * Delete a fact-check
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const factCheck = await FactCheck.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!factCheck) {
      throw createError('Fact-check non trouvé', 404);
    }

    // Decrement user's fact check count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { factChecksCount: -1 },
    });

    res.json({
      success: true,
      message: 'Fact-check supprimé',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/fact-checks
 * Delete all fact-checks for the user
 */
router.delete('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await FactCheck.deleteMany({ userId: req.userId });

    // Reset user's fact check count
    await User.findByIdAndUpdate(req.userId, {
      factChecksCount: 0,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} fact-checks supprimés`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/fact-checks/stats/summary
 * Get statistics for the authenticated user
 */
router.get('/stats/summary', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [total, verdictCounts] = await Promise.all([
      FactCheck.countDocuments({ userId: req.userId }),
      FactCheck.aggregate([
        { $match: { userId: req.userId } },
        { $group: { _id: '$verdict', count: { $sum: 1 } } },
      ]),
    ]);

    const verdicts = verdictCounts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        total,
        verdicts,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
