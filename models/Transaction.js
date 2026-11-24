const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'admin_credit', 'admin_debit', 'sale'],
      required: true,
    },
    method: { type: String, enum: ['card', 'paypal', 'usdt', 'admin', 'order'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    details: {
      cardBrand: String,
      cardLast4: String,
      cardName: String,
      paypalEmail: String,
      network: String,
      address: String,
      txHash: String,
      orderId: String,
    },
    note: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
