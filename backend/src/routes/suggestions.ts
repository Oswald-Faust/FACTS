import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware';
import { generateNewsSuggestions } from '../services/gemini';

const router = Router();
console.log('✅ Suggestions Router Loaded');

/**
 * GET /api/suggestions/news
 * Generate news-based fact check suggestions
 */
router.get('/news', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const suggestions = await generateNewsSuggestions();
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        next(error);
    }
});

export default router;
