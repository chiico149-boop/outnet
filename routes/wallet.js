// Seller wallet: deposit / withdraw via PayPal and USDT
const express = require('express');
const QRCode = require('qrcode');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { requireSeller } = require('../middleware/auth');
const { NETWORKS, validUsdtAddress, validEmail, depositAddresses, depositNetworks } = require('../utils/payments');

const router = express.Router();
router.use(requireSeller);

const MIN_DEPOSIT = 10;
const MIN_WITHDRAW = 20;

function money(v) {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) ? n : 0;
}

// GET /api/wallet
router.get('/', async (req, res) => {
  const txs = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  const pending = txs.filter((t) => t.status === 'pending');
  res.json({
    balance: req.user.balance,
    pendingDeposits: pending.filter((t) => t.type === 'deposit').reduce((a, t) => a + t.amount, 0),
    pendingWithdrawals: pending.filter((t) => t.type === 'withdraw').reduce((a, t) => a + t.amount, 0),
    transactions: txs,
    depositAddresses: depositAddresses(),
    depositNetworks: depositNetworks(),
    paypalReceiver: process.env.PAYPAL_RECEIVER_EMAIL || '',
    payout: req.user.payout,
    limits: { minDeposit: MIN_DEPOSIT, minWithdraw: MIN_WITHDRAW },
  });
});

// GET /api/wallet/qr/:network  -> QR code for our deposit address
router.get('/qr/:network', async (req, res) => {
  const addr = depositAddresses()[req.params.network];
  if (!addr) return res.status(404).json({ message: 'Unknown network' });
  const dataUrl = await QRCode.toDataURL(addr, { margin: 1, width: 220, color: { dark: '#111111', light: '#ffffff' } });
  res.json({ address: addr, qr: dataUrl });
});

// POST /api/wallet/deposit
// body: { method: 'paypal'|'usdt', amount, paypalEmail, network }
router.post('/deposit', async (req, res) => {
  const { method } = req.body;
  const amount = money(req.body.amount);
  if (amount < MIN_DEPOSIT) return res.status(400).json({ message: `Minimum deposit is $${MIN_DEPOSIT}` });
  if (amount > 100000) return res.status(400).json({ message: 'Maximum deposit is $100,000' });

  const details = {};
  if (method === 'paypal') {
    if (!validEmail(req.body.paypalEmail)) return res.status(400).json({ message: 'Enter the PayPal email you paid from' });
    details.paypalEmail = req.body.paypalEmail.trim();
  } else if (method === 'usdt') {
    const { network } = req.body;
    if (!depositNetworks().includes(network)) return res.status(400).json({ message: 'Choose a USDT network' });
    details.network = network;
    details.address = depositAddresses()[network];
  } else {
    return res.status(400).json({ message: 'Choose a payment method' });
  }

  const tx = await Transaction.create({ user: req.user._id, type: 'deposit', method, amount, details, status: 'pending' });
  res.status(201).json({ ok: true, transaction: tx, message: 'Deposit submitted. It will be credited after confirmation.' });
});

// POST /api/wallet/withdraw
// body: { method: 'paypal'|'usdt', amount, paypalEmail, network, address }
router.post('/withdraw', async (req, res) => {
  const { method } = req.body;
  const amount = money(req.body.amount);
  if (amount < MIN_WITHDRAW) return res.status(400).json({ message: `Minimum withdrawal is $${MIN_WITHDRAW}` });

  const details = {};
  if (method === 'paypal') {
    if (!validEmail(req.body.paypalEmail)) return res.status(400).json({ message: 'Enter a valid PayPal email' });
    details.paypalEmail = req.body.paypalEmail.trim();
  } else if (method === 'usdt') {
    const { network, address } = req.body;
    if (!NETWORKS.includes(network)) return res.status(400).json({ message: 'Choose a USDT network' });
    if (!validUsdtAddress(network, address)) {
      return res.status(400).json({
        message: network === 'TRC20' ? 'Invalid TRC20 address (starts with T, 34 chars)' : `Invalid ${network} address (0x + 40 hex chars)`,
      });
    }
    details.network = network;
    details.address = String(address).trim();
  } else {
    return res.status(400).json({ message: 'Choose a withdrawal method' });
  }

  // Atomically reserve the funds so balance can't go negative
  const updated = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  );
  if (!updated) return res.status(400).json({ message: 'Insufficient balance' });

  const tx = await Transaction.create({ user: req.user._id, type: 'withdraw', method, amount, details, status: 'pending' });
  res.status(201).json({ ok: true, transaction: tx, balance: updated.balance, message: 'Withdrawal requested. Funds are on hold until processed.' });
});

module.exports = router;
