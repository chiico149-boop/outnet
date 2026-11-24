// Usage: npm run seed   (WARNING: wipes existing shop data and reloads demo data)
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUri } = require('./utils/db');
const { seedDatabase } = require('./utils/seedData');

(async () => {
  const uri = mongoUri();
  if (!uri) throw new Error('Set MONGO_URI first');
  await mongoose.connect(uri);
  console.log('Connected.');
  await seedDatabase({ wipe: true });
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
