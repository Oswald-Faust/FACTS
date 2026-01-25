import { Response, NextFunction } from 'express';
import { User } from '../models';
import { AuthRequest, createError } from './index';

const FREE_DAILY_LIMIT = 5;

export const checkQuota = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createError('Non authentifié', 401);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    // If premium, strictly no limit
    if (user.isPremium || user.plan === 'monthly' || user.plan === 'yearly') {
      return next();
    }

    // Check last request date to reset counter
    const now = new Date();
    const lastRequest = new Date(user.lastRequestDate || user.createdAt);
    
    const isSameDay = 
      now.getDate() === lastRequest.getDate() &&
      now.getMonth() === lastRequest.getMonth() &&
      now.getFullYear() === lastRequest.getFullYear();

    if (!isSameDay) {
      // Reset quota for new day
      user.dailyRequestsCount = 0;
      user.lastRequestDate = now;
    }

    // Check quota
    if (user.dailyRequestsCount >= FREE_DAILY_LIMIT) {
      // You can customize this error code to trigger the Paywall on client side
      throw createError('Limite quotidienne atteinte. Passez Premium pour continuer.', 403);
    }

    // Increment counter
    user.dailyRequestsCount += 1;
    user.lastRequestDate = now;
    await user.save();

    next();
  } catch (error) {
    next(error);
  }
};
