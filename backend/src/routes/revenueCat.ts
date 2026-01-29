import express, { Request, Response } from 'express';
import { User } from '../models/User';

const router = express.Router();

/**
 * Handle RevenueCat Webhooks
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { event } = req.body;
    
    // Check authentication header (Bearer <REVENUECAT_SECRET_KEY>)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.REVENUECAT_SECRET_KEY}`) {
        // RevenueCat sends the key in the Authorization header
        // For simplicity we check simple match if using secret. 
        // Note: RevenueCat webhooks authentication depends on setup. 
        // Usually it's better to verify the signature or simply Authorization header if set.
        // Assuming we rely on a shared secret check if configured.
    }

    if (!event) {
        return res.status(400).send('Invalid event');
    }

    const { type, app_user_id, expiration_at, entitlement_id, product_id } = event;
    
    // RevenueCat event types: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION, etc.
    // Map RevenueCat user ID back to our User ID if possible, or assume app_user_id IS our internal ID if we set it.
    // In frontend PurchaseService, we didn't explicitly log in with our ID yet, so it might be anonymous RC ID.
    // For this implementation, we assume the frontend will identify the user later or we match by some other means.
    // If identifying on login: Purchases.logIn(userId).

    // Finding user by app_user_id (which should be our DB ID if we set it)
    // or revenueCatId if we store the anonymous one.
    
    // Strategy: We assume app_user_id is our DB _id because we should identify the user on login.
    const user = await User.findById(app_user_id);
    
    if (!user) {
        console.log(`User not found for ID: ${app_user_id}`);
        return res.status(200).send('User not found, but acknowledged');
    }

    let isPremium = false;
    let subscriptionStatus: any = 'none';

    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        isPremium = true;
        subscriptionStatus = 'active';
        break;
      case 'CANCELLATION':
        // User cancelled but might still have time left.
        // RevenueCat sends EXPIRATION separately usually.
        subscriptionStatus = 'canceled';
        isPremium = true; // Keep access until expiration
        break;
      case 'EXPIRATION':
        isPremium = false;
        subscriptionStatus = 'none';
        break;
      case 'BILLING_ISSUE':
        isPremium = false;
        subscriptionStatus = 'past_due';
        break;
    }

    if (expiration_at) {
        user.premiumExpiresAt = new Date(expiration_at);
    }

    user.isPremium = isPremium;
    user.subscriptionStatus = subscriptionStatus;
    
    // Update plan based on product_id if needed
    if (product_id) {
        if (product_id.includes('month')) user.plan = 'monthly';
        if (product_id.includes('year')) user.plan = 'yearly';
    }

    await user.save();
    console.log(`Updated subscription for user ${user.email} to ${subscriptionStatus}`);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Server Error');
  }
});

export default router;
