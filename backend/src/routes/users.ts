/**
 * FACTS Backend - User Routes
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models';
import { authenticate, AuthRequest, createError } from '../middleware';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  photoUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
});

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user?.toJSON(),
    },
  });
});

/**
 * PATCH /api/users/profile
 * Update current user profile
 */
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: data },
      { new: true }
    );

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: {
        user: user.toJSON(),
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
 * POST /api/users/change-password
 * Change user password
 */
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    if (user.provider !== 'email') {
      throw createError('Impossible de changer le mot de passe pour un compte social', 400);
    }

    const isValid = await user.comparePassword(data.currentPassword);
    if (!isValid) {
      throw createError('Mot de passe actuel incorrect', 401);
    }

    user.password = data.newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
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
 * DELETE /api/users/account
 * Delete user account
 */
router.delete('/account', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Delete user and all their fact-checks
    const { FactCheck } = await import('../models');
    
    await Promise.all([
      User.findByIdAndDelete(req.userId),
      FactCheck.deleteMany({ userId: req.userId }),
    ]);

    res.json({
      success: true,
      message: 'Compte supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users/premium/upgrade
 * Upgrade to premium (placeholder for payment integration)
 */
router.post('/premium/upgrade', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // TODO: Integrate with payment provider (Stripe, etc.)
    // For now, just update the user
    const premiumDuration = 30; // days
    const premiumExpiresAt = new Date();
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + premiumDuration);

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        isPremium: true,
        premiumExpiresAt,
        plan: 'yearly',
        subscriptionStatus: 'active',
      },
      { new: true }
    );

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      message: 'Compte mis à niveau vers Premium',
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// File upload configuration
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${(req as any).userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Seules les images sont autorisées!'));
  },
});

/**
 * POST /api/users/avatar
 * Upload user avatar
 */
router.post('/avatar', authenticate, upload.single('avatar'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw createError('Aucun fichier téléchargé', 400);
    }

    // Construct URL
    // Use env variable for base URL if available, otherwise relative or hardcoded logic
    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const photoUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { photoUrl },
      { new: true }
    );

    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    res.json({
      success: true,
      message: 'Photo de profil mise à jour',
      data: {
        photoUrl: user.photoUrl,
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
