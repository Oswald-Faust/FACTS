/**
 * FACTS Backend - FactCheck Routes
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FactCheck, User } from '../models';
import { authenticate, AuthRequest, createError, checkQuota } from '../middleware';

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
router.post('/', authenticate, checkQuota, async (req: AuthRequest, res: Response, next: NextFunction) => {
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

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyWithGemini } from '../services/gemini';

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/fact-checks');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `fact-${(req as any).userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées!'));
  },
});

/**
 * POST /api/fact-checks/verify
 * Verify a claim or image using Gemini (Server-Side)
 * Enforces Quota
 */
router.post('/verify', authenticate, checkQuota, upload.single('image'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { claim, imageUrl } = req.body;
    let imagePath: string | undefined = undefined;

    // Determine image location
    if (req.file) {
      imagePath = req.file.path;
    } else if (imageUrl) {
      imagePath = imageUrl;
    }

    if (!claim && !imagePath) {
      throw createError('Veuillez fournir une affirmation ou une image à vérifier.', 400);
    }

    // Call Gemini Service
    const startTime = Date.now();
    const analysisResult = await verifyWithGemini(claim || '', imagePath);
    const processingTime = Date.now() - startTime;

    // Construct FactCheck document
    // If it was a remote URL, we save that. If local file, we construct a relative URL.
    let savedImageUrl = undefined;
    if (req.file) {
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      savedImageUrl = `${baseUrl}/uploads/fact-checks/${req.file.filename}`;
    } else if (imageUrl) {
      savedImageUrl = imageUrl;
    }

    const factCheck = new FactCheck({
      userId: req.userId,
      claim: claim || (imagePath ? 'Analyse d\'image' : 'Verification'),
      ...analysisResult,
      imageUrl: savedImageUrl,
      processingTimeMs: processingTime,
    });

    await factCheck.save();

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { factChecksCount: 1 },
    });

    res.status(201).json({
      success: true,
      message: 'Vérification terminée',
      data: {
        factCheck: factCheck.toJSON(),
      },
    });

  } catch (error) {
     // If error, we might want to refund quota? For now, simpler to leave it.
    next(error);
  }
});

export default router;
