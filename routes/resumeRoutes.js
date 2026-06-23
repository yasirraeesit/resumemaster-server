import express from 'express';
import multer from 'multer';
import { parseResume, getResumes, saveResume, deleteResume } from '../controllers/resumeController.js';

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

// Parse a resume PDF file
router.post('/parse', upload.single('resume'), parseResume);

// Database actions
router.get('/resumes', getResumes);
router.post('/resumes', saveResume);
router.delete('/resumes/:id', deleteResume);

export default router;
