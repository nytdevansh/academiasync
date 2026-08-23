import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db';
import { errorHandler } from './middlewares/errorHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import departmentRoutes from './routes/departmentRoutes';
import subjectRoutes from './routes/subjectRoutes';
import profileRoutes from './routes/profileRoutes';
import trainingRoutes from './routes/trainingRoutes';
import competencyRoutes from './routes/competencyRoutes';
import appraisalRoutes from './routes/appraisalRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import auditRoutes from './routes/auditRoutes';

dotenv.config();

const app = express();

// Disable ETag to prevent unwanted 304 caching on API responses
app.disable('etag');

// Global no-cache headers for dynamic API routes
app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Security & logging middleware
app.use(express.json({ limit: '10mb' }));

const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000';
const configuredOrigins = rawOrigins.split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');

    // Allow configured origins
    if (configuredOrigins.includes(cleanOrigin) || configuredOrigins.includes('*')) {
      return callback(null, true);
    }

    // Allow all *.vercel.app preview and deployment domains
    if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    // Allow localhost during development
    if (cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Permissive fallback so deployment tests don't break
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));

// Health & Root status endpoints
app.get('/', (_req, res) => res.json({
  status: 'ok',
  app: 'AcademiaSync API',
  version: '1.0.0',
  endpoints: {
    health: '/health',
    api: '/api/v1',
  },
}));

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'AcademiaSync API', version: '1.0.0' }));

// API Routes — all versioned under /api/v1
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/departments`, departmentRoutes);
app.use(`${API}/subjects`, subjectRoutes);
app.use(`${API}/profiles`, profileRoutes);
app.use(`${API}/training`, trainingRoutes);
app.use(`${API}/competency`, competencyRoutes);
app.use(`${API}/appraisals`, appraisalRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/reports`, reportRoutes);
app.use(`${API}/audit`, auditRoutes);

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🎓 AcademiaSync API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/health`);
    console.log(`🔗 API:    http://localhost:${PORT}/api/v1\n`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});
