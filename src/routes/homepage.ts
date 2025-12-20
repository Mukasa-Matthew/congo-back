import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getHomepageSettings,
  updateHomepageSettings,
} from '../controllers/homepage';

const router = express.Router();

// Public route (no authentication)
router.get('/public', getHomepageSettings);

// Protected route (require authentication)
router.get('/', authenticate, getHomepageSettings);
router.put('/', authenticate, updateHomepageSettings);

export default router;

