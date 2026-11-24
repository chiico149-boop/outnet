const mongoose = require('mongoose');

// Uploaded product photos are stored in MongoDB (Vercel's filesystem is read-only)
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
