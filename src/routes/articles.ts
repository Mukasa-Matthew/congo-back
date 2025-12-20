import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  getPublicArticles,
  getPublicArticle,
  getTrendingArticles,
  getRelatedArticles,
} from '../controllers/articles';

const router = express.Router();

// Public routes (no authentication)
router.get('/public', getPublicArticles);
router.get('/public/trending', getTrendingArticles);
router.get('/public/related', getRelatedArticles);
router.get('/public/:id', getPublicArticle);

// Protected routes (require authentication)
router.get('/', authenticate, getArticles);
router.get('/:id', authenticate, getArticle);
router.post('/', authenticate, createArticle);
router.put('/:id', authenticate, updateArticle);
router.delete('/:id', authenticate, deleteArticle);
router.patch('/:id/publish', authenticate, publishArticle);

export default router;



export default router;

