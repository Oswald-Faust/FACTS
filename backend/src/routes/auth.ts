/**
 * FACTS Backend - Auth Routes
 */

import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from '../models';
import { generateToken, authenticate, AuthRequest, createError } from '../middleware';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const socialAuthSchema = z.object({
  email: z.string().email('Email invalide'),
  displayName: z.string().optional(),
  photoUrl: z.string().url().optional(),
  provider: z.enum(['google', 'apple']),
  providerId: z.string(),
});

/**
 * POST /api/auth/register
 * Register a new user with email/password
 */
router.post('/register', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw createError('Un compte existe déjà avec cet email', 400);
    }

    // Create user
    const user = new User({
      email: data.email,
      password: data.password,
      displayName: data.displayName || data.email.split('@')[0],
      provider: 'email',
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: user.toJSON(),
        token,
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
 * POST /api/auth/login
 * Login with email/password
 */
router.post('/login', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user with password
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    // Check password
    const isValid = await user.comparePassword(data.password);
    if (!isValid) {
      throw createError('Email ou mot de passe incorrect', 401);
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        token,
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
 * POST /api/auth/social
 * Login/Register with social provider (Google, Apple)
 */
router.post('/social', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = socialAuthSchema.parse(req.body);

    // Find existing user by email or providerId
    let user = await User.findOne({
      $or: [
        { email: data.email },
        { provider: data.provider, providerId: data.providerId },
      ],
    });

    if (user) {
      // Update provider info if needed
      if (!user.providerId) {
        user.provider = data.provider;
        user.providerId = data.providerId;
        if (data.photoUrl) user.photoUrl = data.photoUrl;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0],
        photoUrl: data.photoUrl,
        provider: data.provider,
        providerId: data.providerId,
      });
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        token,
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
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user?.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token removal)
 */
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

export default router;
