import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getJobApplications,
  createJobApplication,
  updateJobApplication,
  deleteJobApplication
} from '../controllers/jobApplicationController.js';

const router = express.Router();

// Apply requireAuth middleware to secure all job application routes
router.get('/job-applications', requireAuth, getJobApplications);
router.post('/job-applications', requireAuth, createJobApplication);
router.put('/job-applications/:id', requireAuth, updateJobApplication);
router.delete('/job-applications/:id', requireAuth, deleteJobApplication);

export default router;
