// Express application (exported for Vercel; started by server.js locally)
require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const { connectDB, mongoUri } = require('./utils/db');

// JWT secret: use env var, otherwise derive a stable secret from the DB URI (so only MONGO_URI is required)
if (!process.env.JWT_SECRET) {
  const base = mongoUri();
  if (base) {
    process.env.JWT_SECRET = crypto.createHash('sha256').update('theoutfit-jwt:' + base).digest('hex');
    console.warn('⚠ JWT_SECRET not set - using a secret derived from MONGO_URI. Set JWT_SECRET for production.');
  }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});

// Static files (used locally; on Vercel the public/ folder is served by the CDN)
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Health check - open /api/health to diagnose a deployment
app.get('/api/health', async (req, res) => {
  const info = {
    mongoUriSet: !!(process.env.MONGO_URI || process.env.MONGODB_URI),
    jwtSecretSet: !!process.env.JWT_SECRET,
    vercel: !!process.env.VERCEL,
  };
  try {
    await connectDB();
    const Product = require('./models/Product');
    info.db = 'connected';
    info.products = await Product.countDocuments({ isCatalog: false });
    res.json({ ok: true, ...info });
  } catch (err) {
    res.status(503).json({ ok: false, ...info, error: err.message });
  }
});

// Every API request needs the database
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    if (!process.env.JWT_SECRET) throw Object.assign(new Error('JWT_SECRET is not configured'), { status: 503 });
    next();
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/shop'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Hidden admin panel (file: public/the-outfit-admin.html, not linked anywhere)
app.get('/the-outfit-admin', (req, res) => res.redirect('/the-outfit-admin.html'));
app.get('/', (req, res) => res.redirect('/index.html'));

// Errors (multer + generic)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /image files/.test(err.message)) {
    return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 4MB)' : err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.use((req, res) => res.redirect('/404.html'));

module.exports = app;
