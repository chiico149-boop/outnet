const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SELLER_COOKIE = 'tof_token';
const ADMIN_COOKIE = 'tof_admin';

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

function setAuthCookie(res, name, token) {
  res.cookie(name, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function loadUser(req, cookieName) {
  const token = req.cookies[cookieName];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(payload.id);
  } catch {
    return null;
  }
}

async function requireSeller(req, res, next) {
  const user = await loadUser(req, SELLER_COOKIE);
  if (!user || user.role !== 'seller') return res.status(401).json({ message: 'Please log in' });
  if (user.status === 'blocked') {
    res.clearCookie(SELLER_COOKIE);
    return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
  }
  req.user = user;
  next();
}

async function requireAdmin(req, res, next) {
  const user = await loadUser(req, ADMIN_COOKIE);
  if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Admin login required' });
  req.admin = user;
  next();
}

module.exports = {
  SELLER_COOKIE,
  ADMIN_COOKIE,
  signToken,
  setAuthCookie,
  loadUser,
  requireSeller,
  requireAdmin,
};
