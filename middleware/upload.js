const multer = require('multer');
const path = require('path');

// Files are kept in memory and saved to MongoDB (works on Vercel / serverless)
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    const ok = ALLOWED.includes(path.extname(file.originalname).toLowerCase()) && file.mimetype.startsWith('image/');
    cb(ok ? null : new Error('Only image files (jpg, png, webp, gif, avif) are allowed'), ok);
  },
});

module.exports = upload;
