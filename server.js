require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const ensureAdmin = require('./utils/ensureAdmin');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/theoutfit';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env first.');
  process.exit(1);
}

fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (!req.body) req.body = {};
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', require('./routes/shop'));

// Hidden admin panel (not linked anywhere on the site)
app.get('/the-outfit-admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Error handler (multer + generic)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /image files/.test(err.message)) {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✔ MongoDB connected:', MONGO_URI);
    await ensureAdmin();
    app.listen(PORT, () => console.log(`✔ THE OUT FIT running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('✖ MongoDB connection failed:', err.message);
    process.exit(1);
  });
