import { Router } from 'express';

import { authMiddleware } from '../middleware/authMiddleware';
import { createOrder, verifyPayment, webhook } from '../controllers/paymentController';

const router = Router();

router.post('/order', authMiddleware, createOrder);
router.post('/verify', authMiddleware, verifyPayment);

// Public: Razorpay calls this server-to-server. Secured by signature, not JWT.
router.post('/webhook', webhook);

export default router;
