const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { SELLER_COOKIE, ADMIN_COOKIE, signToken, setAuthCookie, requireSeller } = require('../middleware/auth');
const { validEmail } = require('../utils/payments');

const router = express.Router();

// Very small in-memory rate limiter for login attempts
const attempts = new Map();
function tooMany(key) {
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, first: now };
  if (now - rec.first > 15 * 60 * 1000) {
    rec.count = 0;
    rec.first = now;
  }
  rec.count++;
  attempts.set(key, rec);
  return rec.count > 10;
}

function sellerDTO(u) {
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    shopName: u.shopName,
    bio: u.bio,
    avatar: u.avatar,
    phone: u.phone,
    country: u.country,
    balance: u.balance,
    status: u.status,
    flagged: u.flagged,
    payout: u.payout,
    warnings: (u.reports || []).filter((r) => r.byAdmin && !r.resolved).map((r) => ({ reason: r.reason, date: r.createdAt })),
    createdAt: u.createdAt,
  };
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, shopName, country, phone } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ message: 'Please enter your full name' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Please enter a valid email' });
    if (!password || password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 10),
      shopName: (shopName || name).trim(),
      country: country || '',
      phone: phone || '',
      role: 'seller',
    });

    setAuthCookie(res, SELLER_COOKIE, signToken(user));
    res.status(201).json({ user: sellerDTO(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (tooMany('s:' + req.ip)) return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    const user = await User.findOne({ email: String(email || '').toLowerCase().trim(), role: 'seller' }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status === 'blocked') return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
    user.lastLogin = new Date();
    await user.save();
    setAuthCookie(res, SELLER_COOKIE, signToken(user));
    res.json({ user: sellerDTO(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(SELLER_COOKIE);
  res.json({ ok: true });
});

router.get('/me', requireSeller, (req, res) => res.json({ user: sellerDTO(req.user) }));

// PUT /api/auth/profile
router.put('/profile', requireSeller, async (req, res) => {
  const u = req.user;
  const { name, shopName, bio, phone, country, avatar, paypalEmail, usdtNetwork, usdtAddress } = req.body;
  if (name !== undefined) u.name = String(name).slice(0, 80);
  if (shopName !== undefined) u.shopName = String(shopName).slice(0, 80);
  if (bio !== undefined) u.bio = String(bio).slice(0, 500);
  if (phone !== undefined) u.phone = String(phone).slice(0, 30);
  if (country !== undefined) u.country = String(country).slice(0, 60);
  if (avatar !== undefined) u.avatar = String(avatar).slice(0, 300);
  if (paypalEmail !== undefined) u.payout.paypalEmail = String(paypalEmail).slice(0, 120);
  if (usdtNetwork !== undefined) u.payout.usdtNetwork = ['TRC20', 'ERC20', 'BEP20'].includes(usdtNetwork) ? usdtNetwork : '';
  if (usdtAddress !== undefined) u.payout.usdtAddress = String(usdtAddress).slice(0, 120);
  await u.save();
  res.json({ user: sellerDTO(u) });
});

// PUT /api/auth/password
router.put('/password', requireSeller, async (req, res) => {
  const { current, next } = req.body;
  const u = await User.findById(req.user._id).select('+password');
  if (!(await bcrypt.compare(current || '', u.password))) return res.status(400).json({ message: 'Current password is wrong' });
  if (!next || next.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
  u.password = await bcrypt.hash(next, 10);
  await u.save();
  res.json({ ok: true });
});

// ---------- Admin auth ----------
router.post('/admin/login', async (req, res) => {
  try {
    if (tooMany('a:' + req.ip)) return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    const { username, password } = req.body;
    const admin = await User.findOne({ username: String(username || '').toLowerCase().trim(), role: 'admin' }).select('+password');
    if (!admin || !(await bcrypt.compare(password || '', admin.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    admin.lastLogin = new Date();
    await admin.save();
    setAuthCookie(res, ADMIN_COOKIE, signToken(admin));
    res.json({ ok: true, name: admin.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/admin/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE);
  res.json({ ok: true });
});

module.exports = router;
module.exports.sellerDTO = sellerDTO;
