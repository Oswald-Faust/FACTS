import { Response, NextFunction } from 'express';
import { User, GlobalSettings } from '../models';
import { AuthRequest, createError } from './index';

// Cache settings purely for fallback or performance if needed (optional optimization)
// For now, we fetch every time to ensure real-time updates from Admin Dashboard
const DEFAULT_FREE_LIMIT = 10;

export const checkQuota = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw createError('Non authentifié', 401);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw createError('Utilisateur non trouvé', 404);
    }

    // Load global settings
    let settings = await GlobalSettings.findOne();
    if (!settings) {
      // Create default settings if not exists
      settings = await GlobalSettings.create({
        freeDailyLimit: DEFAULT_FREE_LIMIT,
        premiumDailyLimit: 0
      });
    }

    // Determine limit based on plan
    let dailyLimit = settings.freeDailyLimit;
    
    // Check premium status
    if (user.isPremium || user.plan === 'monthly' || user.plan === 'yearly') {
        const premiumLimit = settings.premiumDailyLimit;
        // If premium limit is 0, it means unlimited
        if (premiumLimit === 0) {
            return next();
        }
        dailyLimit = premiumLimit;
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
    if (user.dailyRequestsCount >= dailyLimit) {
      throw createError(`Limite quotidienne atteinte (${dailyLimit}). Passez Premium pour plus.`, 403);
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
