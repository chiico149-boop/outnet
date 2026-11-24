const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: '', maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: Number, default: 100, min: 0 },
    sizes: [{ type: String }],
    colors: [{ type: String }],

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },

    // Master catalog item (supplier product that sellers can choose to dropship)
    isCatalog: { type: Boolean, default: false },
    // When a seller chooses a catalog product, the listing references it
    sourceProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

    status: { type: String, enum: ['active', 'hidden'], default: 'active' },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
