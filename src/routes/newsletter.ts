import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  subscribeNewsletter,
  getNewsletterSubscribers,
  unsubscribeNewsletter,
} from '../controllers/newsletter';

const router = express.Router();

// Public route - anyone can subscribe
router.post('/subscribe', subscribeNewsletter);

// Public route - unsubscribe
router.post('/unsubscribe', unsubscribeNewsletter);

// Protected routes - admin only
router.get('/subscribers', authenticate, getNewsletterSubscribers);

export default router;


