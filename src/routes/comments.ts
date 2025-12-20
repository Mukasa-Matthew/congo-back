import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getComments,
  approveComment,
  deleteComment,
  toggleComments,
} from '../controllers/comments';

const router = express.Router();

router.get('/', authenticate, getComments);
router.patch('/:id/approve', authenticate, approveComment);
router.delete('/:id', authenticate, deleteComment);
router.patch('/toggle', authenticate, toggleComments);

export default router;

