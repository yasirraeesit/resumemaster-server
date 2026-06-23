import express from 'express';
import multer from 'multer';
import { parseResume, getResumes, saveResume, deleteResume, scoreResumeATS } from '../controllers/resumeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer memory storage configuration for receiving resume uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported.'));
    }
  }
});

// Parse a resume PDF file (can be done without full login for landing page sandbox, or we can keep it open)
router.post('/parse', upload.single('resume'), parseResume);

// ATS Score Engine — public so users can try before signing in
router.post('/score-ats', scoreResumeATS);

// Database actions (strictly secured)
router.get('/resumes', requireAuth, getResumes);
router.post('/resumes', requireAuth, saveResume);
router.delete('/resumes/:id', requireAuth, deleteResume);

export default router;
