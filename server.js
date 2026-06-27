import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import matcherRoutes from './routes/matcherRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import careerRoutes from './routes/careerRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

// Load environment configurations from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/resumemaster';
mongoose.connect(MONGO_URI)
  .then(() => console.log('[Database] Connected to MongoDB locally (Compass ready)'))
  .catch(err => console.error('[Database Connection Error]:', err.message));

// Middleware configurations
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  
  // Safely mask the MongoDB URI for debugging
  let maskedUri = 'undefined';
  if (process.env.MONGO_URI) {
    maskedUri = process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@');
  }

  res.json({
    status: 'OK',
    message: 'ATS Resume Builder backend API running smoothly.',
    database: {
      status: dbStates[dbStatus],
      code: dbStatus,
      uri: maskedUri
    }
  });
});

// Route registration
app.use('/api', authRoutes);
app.use('/api', resumeRoutes);
app.use('/api', matcherRoutes);
app.use('/api', aiRoutes);
app.use('/api', careerRoutes);
app.use('/api', documentRoutes);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize server listener
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[Server] ATS backend running in development mode on http://localhost:${PORT}`);
  });
}

export default app;
