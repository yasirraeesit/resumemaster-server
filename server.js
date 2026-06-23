import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import resumeRoutes from './routes/resumeRoutes.js';
import matcherRoutes from './routes/matcherRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import careerRoutes from './routes/careerRoutes.js';

// Load environment configurations from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware configurations
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'ATS Resume Builder backend API running smoothly.' });
});

// Route registration
app.use('/api', resumeRoutes);
app.use('/api', matcherRoutes);
app.use('/api', aiRoutes);
app.use('/api', careerRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize server listener
app.listen(PORT, () => {
  console.log(`[Server] ATS backend running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});
