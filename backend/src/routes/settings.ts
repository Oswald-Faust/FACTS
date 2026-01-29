import { Router, Response } from 'express';
import { z } from 'zod';
import { GlobalSettings } from '../models';
import { authenticate, AuthRequest, createError } from '../middleware';

const router = Router();

// Validation schema
const settingsSchema = z.object({
  freeDailyLimit: z.number().int().min(0).optional(),
  premiumDailyLimit: z.number().int().min(-1).optional(),
  isMaintenanceMode: z.boolean().optional(),
  minAppVersion: z.string().optional(),
});

/**
 * GET /api/settings
 * Get global settings
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      settings = await GlobalSettings.create({
        freeDailyLimit: 10,
        premiumDailyLimit: 0
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/settings
 * Update global settings (restricted to Admin in future, shared for now)
 */
router.patch('/', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    // TODO: Add isAdmin check here once role system is in place
    // const user = await User.findById(req.userId);
    // if (user.role !== 'admin') throw createError('Accès refusé', 403);

    const data = settingsSchema.parse(req.body);

    const settings = await GlobalSettings.findOneAndUpdate(
      {},
      { $set: data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Paramètres mis à jour',
      data: settings,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createError(error.errors[0].message, 400));
    } else {
      next(error);
    }
  }
});

export default router;
