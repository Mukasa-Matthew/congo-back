import express from 'express';
import { authenticate } from '../middleware/auth';
import { getTags, getTag, createTag, updateTag, deleteTag } from '../controllers/tags';

const router = express.Router();

router.get('/', authenticate, getTags);
router.get('/:id', authenticate, getTag);
router.post('/', authenticate, createTag);
router.put('/:id', authenticate, updateTag);
router.delete('/:id', authenticate, deleteTag);

export default router;

