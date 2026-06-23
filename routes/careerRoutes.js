import express from 'express';
import { generateCoverLetter, generateLinkedIn, generateInterviewPrep } from '../controllers/careerController.js';

const router = express.Router();

// Generate tailored Cover Letter
router.post('/career/cover-letter', generateCoverLetter);

// Generate optimized LinkedIn Headline and About Summary
router.post('/career/linkedin', generateLinkedIn);

// Predict Interview Questions and Tips
router.post('/career/interview-prep', generateInterviewPrep);

export default router;
