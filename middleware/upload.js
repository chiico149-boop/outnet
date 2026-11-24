const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext);
  },
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED.includes(path.extname(file.originalname).toLowerCase()) && file.mimetype.startsWith('image/');
    cb(ok ? null : new Error('Only image files (jpg, png, webp, gif, avif) are allowed'), ok);
  },
});

module.exports = upload;
