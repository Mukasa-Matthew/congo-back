import express from 'express';
import { getSettings, getPublicSettings, updateSettings } from '../controllers/settings';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public route (for public frontend)
router.get('/public', getPublicSettings);

// Protected routes (for admin panel)
router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);

export default router;

