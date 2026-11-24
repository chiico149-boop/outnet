const mongoose = require('mongoose');
const Image = require('../models/Image');

// Save multer memory files to MongoDB and return their public URLs
async function saveImages(files = []) {
  if (!files || !files.length) return [];
  const docs = await Image.insertMany(files.map((f) => ({ data: f.buffer, contentType: f.mimetype, size: f.size })));
  return docs.map((d) => '/api/images/' + d._id);
}

async function deleteImages(urls = []) {
  const ids = urls
    .filter((u) => typeof u === 'string' && u.startsWith('/api/images/'))
    .map((u) => u.split('/').pop())
    .filter((id) => mongoose.isValidObjectId(id));
  if (ids.length) await Image.deleteMany({ _id: { $in: ids } });
}

module.exports = { saveImages, deleteImages };
