const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        title: String,
        image: String,
        price: Number,
        qty: Number,
        size: String,
      },
    ],
    buyer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: { type: String, required: true },
      city: String,
      country: String,
      zip: String,
    },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['card', 'paypal', 'usdt'], required: true },
    paymentRef: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    credited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'TOF-' + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 900 + 100);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
