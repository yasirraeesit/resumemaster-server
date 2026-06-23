import express from 'express';
import { matchJob } from '../controllers/matcherController.js';

const router = express.Router();

// Compare resume text with a target job description listing
router.post('/match', matchJob);

export default router;
