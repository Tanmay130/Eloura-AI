import { Router } from 'express';

import { authMiddleware } from '../middleware/authMiddleware';
import { generate, listImages, remove } from '../controllers/imageController';

const router = Router();

// Every image route requires a valid JWT (req.user is populated by the guard).
router.get('/', authMiddleware, listImages);
router.post('/generate', authMiddleware, generate);
router.delete('/:id', authMiddleware, remove);

export default router;
