const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true, maxlength: 500 },
    reporterName: { type: String, default: 'Anonymous' },
    reporterEmail: { type: String, default: '' },
    byAdmin: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['seller', 'admin'], default: 'seller' },

    shopName: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, maxlength: 500, default: '' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    country: { type: String, default: '' },

    balance: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'blocked'], default: 'active' },
    flagged: { type: Boolean, default: false },
    reports: [reportSchema],

    payout: {
      paypalEmail: { type: String, default: '' },
      usdtNetwork: { type: String, enum: ['TRC20', 'ERC20', 'BEP20', ''], default: '' },
      usdtAddress: { type: String, default: '' },
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  return {
    _id: this._id,
    name: this.name,
    shopName: this.shopName || this.name,
    bio: this.bio,
    avatar: this.avatar,
    country: this.country,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
