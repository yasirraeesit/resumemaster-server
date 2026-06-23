import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/profile', requireAuth, getProfile);
router.put('/auth/profile', requireAuth, updateProfile);

export default router;
