// Serverless-friendly MongoDB connection (cached across invocations) + first-run bootstrap
const mongoose = require('mongoose');
const ensureAdmin = require('./ensureAdmin');

const g = global.__tofdb || (global.__tofdb = { conn: null, promise: null, ready: null });

function mongoUri() {
  return process.env.MONGO_URI || process.env.MONGODB_URI || (process.env.VERCEL ? '' : 'mongodb://127.0.0.1:27017/theoutfit');
}

async function connectDB() {
  if (g.conn && mongoose.connection.readyState === 1) return g.conn;
  const uri = mongoUri();
  if (!uri) {
    const e = new Error('Database not configured: add the MONGO_URI environment variable in Vercel (Settings → Environment Variables) and redeploy.');
    e.status = 503;
    throw e;
  }
  if (!g.promise) {
    g.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 })
      .then((m) => {
        console.log('✔ MongoDB connected');
        return m;
      })
      .catch((err) => {
        g.promise = null;
        const e = new Error('Cannot connect to MongoDB: ' + err.message + ' (check MONGO_URI and Atlas Network Access → allow 0.0.0.0/0)');
        e.status = 503;
        throw e;
      });
  }
  g.conn = await g.promise;

  // One-time bootstrap per instance: admin account + demo data if the DB is empty
  if (!g.ready) {
    g.ready = (async () => {
      await ensureAdmin();
      const Category = require('../models/Category');
      if ((await Category.estimatedDocumentCount()) === 0) {
        const { seedDatabase } = require('./seedData');
        await seedDatabase({ wipe: false, quiet: true });
      }
    })().catch((err) => {
      g.ready = null;
      console.error('Bootstrap error:', err.message);
    });
  }
  await g.ready;
  return g.conn;
}

module.exports = { connectDB, mongoUri };
