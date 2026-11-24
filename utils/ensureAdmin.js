const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Creates the admin account from .env if it doesn't exist yet
module.exports = async function ensureAdmin() {
  const username = (process.env.ADMIN_USER || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASS || 'admin1212';
  const existing = await User.findOne({ role: 'admin', username });
  if (existing) return existing;
  const admin = await User.create({
    name: 'Administrator',
    username,
    email: `${username}@theoutfit.local`,
    password: await bcrypt.hash(password, 10),
    role: 'admin',
  });
  console.log(`✔ Admin account created (username: ${username})`);
  return admin;
};
