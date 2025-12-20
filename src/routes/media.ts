import express from 'express';
import { authenticate } from '../middleware/auth';
import { getMedia, uploadMedia, deleteMedia } from '../controllers/media';
import { upload } from '../config/upload';

const router = express.Router();

router.get('/', authenticate, getMedia);
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.delete('/:id', authenticate, deleteMedia);

export default router;

