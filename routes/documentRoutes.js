import express from 'express';
import { getDocuments, saveDocument, deleteDocument } from '../controllers/documentController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Document management endpoints (secured)
router.get('/documents', requireAuth, getDocuments);
router.post('/documents', requireAuth, saveDocument);
router.delete('/documents/:id', requireAuth, deleteDocument);

export default router;
