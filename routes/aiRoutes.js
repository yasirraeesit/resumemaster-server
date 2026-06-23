import express from 'express';
import { enhanceBullet, suggestBullets } from '../controllers/aiController.js';

const router = express.Router();

// Route: Optimize an existing work experience bullet block
router.post('/ai/enhance', enhanceBullet);

// Route: Suggest bullet accomplishments based on a target JD
router.post('/ai/suggest', suggestBullets);

export default router;
