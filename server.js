// server.js  –  Misfar Backend Entry Point
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

const authRoutes       = require('./routes/authRoutes');
const userRoutes       = require('./routes/userRoutes');
const destRoutes       = require('./routes/destinationRoutes');
const tripRoutes       = require('./routes/tripRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const recRoutes        = require('./routes/recommendationRoutes');
const { chatRouter, actRouter } = require('./routes/otherRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ──────────────────────────────────────────
app.use(
 helmet({
   crossOriginResourcePolicy: { policy: "cross-origin" },
 })
);

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in development (needed for network sharing)
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Static: serve uploaded files ──────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ══════════════════════════════════════════════════════════════
//  ROUTES
// ══════════════════════════════════════════════════════════════
app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/destinations',    destRoutes);
app.use('/api/trips',           tripRoutes);
app.use('/api/recommendations', recRoutes);
app.use('/api/chatbot',         chatRouter);
app.use('/api/activities',      actRouter);
app.use('/api/admin',           adminRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Misfar API is running 🌍',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── 404 + Error handlers ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[OK] Misfar API running on http://localhost:${PORT}`);
  console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n[INFO] Available endpoints:`);
  console.log(`   POST  /api/auth/register`);
  console.log(`   POST  /api/auth/login`);
  console.log(`   GET   /api/destinations`);
  console.log(`   GET   /api/recommendations`);
  console.log(`   POST  /api/trips/ai-generate`);
  console.log(`   POST  /api/chatbot/message`);
  console.log(`   GET   /api/admin/analytics`);
  console.log(`   GET   /api/health\n`);
});

module.exports = app;
