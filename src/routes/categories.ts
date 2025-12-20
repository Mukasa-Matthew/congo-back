import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories';

const router = express.Router();

// Public route (no authentication)
router.get('/public', getCategories);

// Protected routes (require authentication)
router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, getCategory);
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;

