// Demo data: fashion categories, demo sellers, products, reviews, catalog, and sample wallet data.
// Used by `npm run seed` (wipe) and automatically when the database is empty (first deploy).
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const ensureAdmin = require('./ensureAdmin');

const IMG = (f) => `/images/products/${f}.png`;

const categories = [
  { name: 'Women', slug: 'women', description: 'Dresses, coats & knitwear', image: IMG('p01_satin_dress') },
  { name: 'Men', slug: 'men', description: 'Shirts, jackets & essentials', image: IMG('p04_denim_jacket') },
  { name: 'Shoes', slug: 'shoes', description: 'Sneakers, boots & heels', image: IMG('p07_white_sneakers') },
  { name: 'Bags', slug: 'bags', description: 'Totes, shoulder & crossbody', image: IMG('p10_quilted_bag') },
  { name: 'Watches', slug: 'watches', description: 'Timeless timepieces', image: IMG('p13_gold_watch') },
  { name: 'Jewelry', slug: 'jewelry', description: 'Gold, pearls & rings', image: IMG('p16_gold_hoops') },
  { name: 'Accessories', slug: 'accessories', description: 'Sunglasses, scarves & hats', image: IMG('p19_aviator_sunglasses') },
  { name: 'Sportswear', slug: 'sportswear', description: 'Performance & athleisure', image: IMG('p22_running_shoes') },
];

const sellers = [
  {
    key: 'elan',
    name: 'Sophie Laurent',
    email: 'elan@theoutfit.com',
    shopName: 'Maison Élan',
    country: 'France',
    bio: 'Parisian-inspired womenswear and fine jewelry. Timeless pieces crafted for the modern woman.',
    avatar: IMG('p17_pearl_necklace'),
    balance: 1250.5,
  },
  {
    key: 'urban',
    name: 'Marcus Reed',
    email: 'urban@theoutfit.com',
    shopName: 'Urban Thread Co.',
    country: 'United States',
    bio: 'Elevated menswear essentials and performance sportswear for everyday movement.',
    avatar: IMG('p04_denim_jacket'),
    balance: 870,
  },
  {
    key: 'luxe',
    name: 'Amira Haddad',
    email: 'luxe@theoutfit.com',
    shopName: 'Luxe Atelier',
    country: 'United Arab Emirates',
    bio: 'Curated luxury leather goods and statement watches. Quality you can feel.',
    avatar: IMG('p10_quilted_bag'),
    balance: 2310.75,
  },
  {
    key: 'stride',
    name: 'Leo Martins',
    email: 'stride@theoutfit.com',
    shopName: 'Stride & Style',
    country: 'Portugal',
    bio: 'Handpicked footwear and finishing-touch accessories for every occasion.',
    avatar: IMG('p08_chelsea_boots'),
    balance: 540.2,
  },
];

const S_XL = ['XS', 'S', 'M', 'L', 'XL'];
const EU = ['38', '39', '40', '41', '42', '43', '44'];

const products = [
  // Women
  { cat: 'women', seller: 'elan', img: 'p01_satin_dress', title: 'Champagne Satin Slip Midi Dress', price: 89, compare: 129, sizes: S_XL, colors: ['Champagne', 'Black'], featured: true,
    desc: 'A fluid bias-cut slip dress in lustrous satin with delicate adjustable straps and a softly draped cowl neckline. Falls elegantly to mid-calf. Perfect from evening events to summer weddings.' },
  { cat: 'women', seller: 'elan', img: 'p02_wool_coat', title: 'Oversized Camel Wool-Blend Coat', price: 189, compare: 249, sizes: S_XL, colors: ['Camel', 'Grey'], featured: true,
    desc: 'Relaxed, oversized silhouette in a premium wool blend. Dropped shoulders, notch lapels, deep pockets and a fully lined interior keep you warm and polished all season.' },
  { cat: 'women', seller: 'elan', img: 'p03_knit_cardigan', title: 'Cream Ribbed Knit Cardigan', price: 64, compare: 0, sizes: S_XL, colors: ['Cream', 'Sage'],
    desc: 'Soft ribbed knit cardigan with pearl-effect buttons. Cozy, versatile and easy to layer over dresses or tees.' },
  // Men
  { cat: 'men', seller: 'urban', img: 'p04_denim_jacket', title: 'Classic Denim Trucker Jacket', price: 79, compare: 99, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Mid Wash'], featured: true,
    desc: 'The timeless trucker jacket in durable 12oz cotton denim. Button front, chest flap pockets and adjustable waist tabs. Gets better with every wear.' },
  { cat: 'men', seller: 'urban', img: 'p05_oxford_shirt', title: 'Slim Fit White Oxford Shirt', price: 49, compare: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['White', 'Light Blue'],
    desc: 'Crisp breathable oxford cotton with a button-down collar and a tailored slim fit. A wardrobe essential that works with chinos, denim or a suit.' },
  { cat: 'men', seller: 'urban', img: 'p06_merino_sweater', title: 'Navy Merino Crewneck Sweater', price: 69, compare: 89, sizes: ['S', 'M', 'L', 'XL'], colors: ['Navy', 'Charcoal'],
    desc: '100% extra-fine merino wool. Lightweight, temperature regulating and naturally odor resistant. Ribbed cuffs and hem.' },
  // Shoes
  { cat: 'shoes', seller: 'stride', img: 'p07_white_sneakers', title: 'Minimal White Leather Sneakers', price: 95, compare: 120, sizes: EU, colors: ['White'], featured: true,
    desc: 'Clean, minimalist low-tops in full-grain Italian leather with a cushioned insole and durable rubber cupsole. Goes with absolutely everything.' },
  { cat: 'shoes', seller: 'stride', img: 'p08_chelsea_boots', title: 'Brown Suede Chelsea Boots', price: 135, compare: 0, sizes: EU, colors: ['Brown', 'Black'],
    desc: 'Premium suede Chelsea boots with elastic side panels, pull tabs and a stacked heel. Water-repellent treatment for everyday wear.' },
  { cat: 'shoes', seller: 'stride', img: 'p09_heeled_sandals', title: 'Black Strappy Heeled Sandals', price: 85, compare: 110, sizes: ['36', '37', '38', '39', '40', '41'], colors: ['Black', 'Nude'],
    desc: 'Elegant strappy sandals in soft nappa leather with a 9cm stiletto heel and adjustable ankle buckle.' },
  // Bags
  { cat: 'bags', seller: 'luxe', img: 'p10_quilted_bag', title: 'Quilted Leather Chain Shoulder Bag', price: 159, compare: 219, sizes: [], colors: ['Black', 'Beige'], featured: true,
    desc: 'Diamond-quilted lambskin leather with a gold-tone chain strap and turn-lock closure. Interior zip pocket and card slots.' },
  { cat: 'bags', seller: 'luxe', img: 'p11_canvas_tote', title: 'Canvas Tote with Leather Handles', price: 59, compare: 0, sizes: [], colors: ['Natural'],
    desc: 'Heavyweight canvas tote with genuine tan leather handles and an interior zip pocket. Fits a 15" laptop.' },
  { cat: 'bags', seller: 'luxe', img: 'p12_crossbody_bag', title: 'Cognac Leather Crossbody Bag', price: 99, compare: 129, sizes: [], colors: ['Cognac', 'Black'],
    desc: 'Compact crossbody in vegetable-tanned leather with gold buckle detail and adjustable strap. Hands-free elegance.' },
  // Watches
  { cat: 'watches', seller: 'luxe', img: 'p13_gold_watch', title: 'Minimalist Gold Mesh Watch', price: 129, compare: 179, sizes: [], colors: ['Gold', 'Silver'], featured: true,
    desc: 'Slim 32mm case with a clean white dial, Japanese quartz movement and an adjustable gold mesh strap. Water resistant to 3ATM.' },
  { cat: 'watches', seller: 'luxe', img: 'p14_chrono_watch', title: 'Steel Chronograph Watch', price: 199, compare: 259, sizes: [], colors: ['Steel/Black'],
    desc: '42mm stainless steel chronograph with sapphire-coated crystal, luminous hands and a solid link bracelet. 10ATM water resistance.' },
  { cat: 'watches', seller: 'luxe', img: 'p15_leather_watch', title: 'Classic Leather Strap Watch', price: 115, compare: 0, sizes: [], colors: ['Brown/Rose Gold'],
    desc: 'Rose-gold case, cream dial and genuine Italian leather strap. A refined everyday timepiece.' },
  // Jewelry
  { cat: 'jewelry', seller: 'elan', img: 'p16_gold_hoops', title: '18K Gold Chunky Hoop Earrings', price: 45, compare: 65, sizes: [], colors: ['Gold'], featured: true,
    desc: 'Lightweight hollow hoops plated in 18K gold over sterling silver. Hypoallergenic and tarnish resistant.' },
  { cat: 'jewelry', seller: 'elan', img: 'p17_pearl_necklace', title: 'Freshwater Pearl Pendant Necklace', price: 55, compare: 0, sizes: [], colors: ['Gold'],
    desc: 'A single lustrous freshwater pearl on a delicate 18K gold-plated chain. Adjustable 40–45cm length.' },
  { cat: 'jewelry', seller: 'elan', img: 'p18_signet_ring', title: 'Gold Onyx Signet Ring', price: 75, compare: 95, sizes: ['6', '7', '8', '9', '10'], colors: ['Gold/Onyx'],
    desc: 'Bold signet ring with a polished black onyx stone set in 18K gold vermeil.' },
  // Accessories
  { cat: 'accessories', seller: 'stride', img: 'p19_aviator_sunglasses', title: 'Gold Aviator Sunglasses', price: 65, compare: 89, sizes: [], colors: ['Gold/Brown'], featured: true,
    desc: 'Classic aviators with a lightweight gold metal frame and gradient brown polarized lenses. 100% UV400 protection.' },
  { cat: 'accessories', seller: 'stride', img: 'p20_silk_scarf', title: 'Baroque Print Silk Scarf', price: 49, compare: 0, sizes: [], colors: ['Navy/Gold'],
    desc: '100% mulberry silk twill square scarf (90x90cm) with hand-rolled edges and an elegant baroque print.' },
  { cat: 'accessories', seller: 'stride', img: 'p21_wool_fedora', title: 'Camel Wool Felt Fedora', price: 58, compare: 75, sizes: ['S', 'M', 'L'], colors: ['Camel'],
    desc: 'Structured fedora in 100% wool felt with a grosgrain ribbon band. Adds instant polish to any outfit.' },
  // Sportswear
  { cat: 'sportswear', seller: 'urban', img: 'p22_running_shoes', title: 'Performance Knit Running Shoes', price: 110, compare: 140, sizes: EU, colors: ['Black/Coral'], featured: true,
    desc: 'Breathable engineered knit upper, responsive foam midsole and a grippy rubber outsole for road running and training.' },
  { cat: 'sportswear', seller: 'urban', img: 'p23_leggings_set', title: 'Seamless Sage Activewear Set', price: 72, compare: 95, sizes: ['XS', 'S', 'M', 'L'], colors: ['Sage', 'Black'],
    desc: 'Matching sports bra and high-waist leggings in a seamless, squat-proof, sweat-wicking knit with four-way stretch.' },
  { cat: 'sportswear', seller: 'urban', img: 'p24_track_jacket', title: 'Hooded Zip Track Jacket', price: 68, compare: 0, sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Black/White'],
    desc: 'Lightweight technical track jacket with a full zip, hood and contrast side stripes. Zippered pockets.' },
];

const reviewers = ['Emma W.', 'Liam K.', 'Olivia R.', 'Noah S.', 'Ava M.', 'Yasmine B.', 'Lucas D.', 'Mia T.', 'Karim A.', 'Chloé P.', 'James H.', 'Sara N.', 'Daniel V.', 'Ines F.', 'Omar Z.'];
const comments = {
  5: [
    'Absolutely love it! The quality is amazing for the price.',
    'Exceeded my expectations. Fits perfectly and looks even better in person.',
    'Fast shipping and beautiful packaging. Will definitely order again!',
    'Premium feel, great materials. Got so many compliments.',
    'Exactly as pictured. 10/10 would recommend this seller.',
  ],
  4: [
    'Really nice quality, just took a few extra days to arrive.',
    'Very happy with it. Sizing runs slightly large, order one size down.',
    'Beautiful piece, great value. Packaging could be better.',
    'Looks great and feels well made. Happy with my purchase.',
  ],
  3: ['Decent product, but the color is a bit different from the photos.', 'Okay for the price. Expected slightly better finishing.'],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const randRating = () => {
  const r = Math.random();
  return r < 0.65 ? 5 : r < 0.92 ? 4 : 3;
};
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

async function seedDatabase({ wipe = true, quiet = false } = {}) {
  const log = (...a) => !quiet && console.log(...a);
  if (wipe) {
    log('Clearing shop data...');
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Review.deleteMany({}),
      Transaction.deleteMany({}),
      Order.deleteMany({}),
    ]);
  }
  const oldDemo = await User.find({ role: 'seller', email: { $in: sellers.map((s) => s.email) } }).distinct('_id');
  await Promise.all([User.deleteMany({ _id: { $in: oldDemo } }), Product.deleteMany({ seller: { $in: oldDemo } })]);

  const admin = await ensureAdmin();

  // Inserting categories first also acts as a lock: a parallel seeding attempt fails on the unique slug index
  let catDocs;
  try {
    catDocs = await Category.insertMany(categories.map((c, i) => ({ ...c, order: i })));
  } catch (err) {
    if (err.code === 11000) return log('Categories already exist - skipping seed');
    throw err;
  }
  console.log('Seeding demo data...');
  const catBySlug = Object.fromEntries(catDocs.map((c) => [c.slug, c]));

  const pass = await bcrypt.hash('seller123', 10);
  const sellerDocs = {};
  for (const s of sellers) {
    sellerDocs[s.key] = await User.create({
      name: s.name,
      email: s.email,
      password: pass,
      shopName: s.shopName,
      country: s.country,
      bio: s.bio,
      avatar: s.avatar,
      balance: s.balance,
      role: 'seller',
      payout: { paypalEmail: s.email.replace('@theoutfit.com', '@paypal.me') },
    });
  }

  for (const [i, p] of products.entries()) {
    const cat = catBySlug[p.cat];
    // master catalog item (supplier cost ~55% of retail)
    const catalogItem = await Product.create({
      title: p.title,
      description: p.desc,
      price: Math.round(p.price * 0.55 * 100) / 100,
      images: [IMG(p.img)],
      category: cat._id,
      seller: admin._id,
      stock: 500,
      sizes: p.sizes,
      colors: p.colors,
      isCatalog: true,
    });
    // seller listing based on the catalog item
    const listing = await Product.create({
      title: p.title,
      description: p.desc,
      price: p.price,
      comparePrice: p.compare,
      images: [IMG(p.img)],
      category: cat._id,
      seller: sellerDocs[p.seller]._id,
      stock: 20 + Math.floor(Math.random() * 120),
      sizes: p.sizes,
      colors: p.colors,
      featured: !!p.featured,
      sales: 10 + Math.floor(Math.random() * 400),
      sourceProduct: catalogItem._id,
      createdAt: daysAgo(products.length - i),
    });
    const n = 3 + Math.floor(Math.random() * 4);
    const used = new Set();
    const reviews = [];
    for (let k = 0; k < n; k++) {
      let name;
      do name = pick(reviewers);
      while (used.has(name));
      used.add(name);
      const rating = randRating();
      reviews.push({ product: listing._id, name, rating, comment: pick(comments[rating]), createdAt: daysAgo(Math.floor(Math.random() * 60) + 1) });
    }
    await Review.insertMany(reviews);
    await Review.recalc(listing._id);
  }

  // Sample wallet activity
  const { elan, urban, luxe, stride } = sellerDocs;
  await Transaction.insertMany([
    { user: elan._id, type: 'admin_credit', method: 'admin', amount: 500, note: 'Welcome bonus', status: 'approved', reviewedAt: daysAgo(10), createdAt: daysAgo(10) },
    { user: elan._id, type: 'deposit', method: 'card', amount: 250, details: { cardBrand: 'Visa', cardLast4: '4242', cardName: 'Sophie Laurent' }, status: 'pending' },
    { user: urban._id, type: 'deposit', method: 'usdt', amount: 300, details: { network: 'TRC20', address: process.env.USDT_TRC20, txHash: 'a3f9c2e1b7d84f6a9e0c3b5d7f1a2e4c6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a' }, status: 'pending' },
    { user: luxe._id, type: 'withdraw', method: 'paypal', amount: 150, details: { paypalEmail: 'luxe@paypal.me' }, status: 'pending' },
    { user: stride._id, type: 'deposit', method: 'paypal', amount: 120, details: { paypalEmail: 'stride@paypal.me' }, status: 'approved', reviewedAt: daysAgo(3), createdAt: daysAgo(3) },
  ]);

  // Sample public report
  urban.reports.push({ reason: 'Package arrived later than the estimated delivery date.', reporterName: 'Customer', reporterEmail: 'customer@example.com' });
  await urban.save();

  console.log(`✔ Seeded ${catDocs.length} categories, ${products.length} listings (+${products.length} catalog items), ${sellers.length} sellers.`);
  log('  Demo seller login: elan@theoutfit.com / seller123  (also urban@, luxe@, stride@)');
  log(`  Admin panel: /the-outfit-admin  user: ${process.env.ADMIN_USER || 'admin'}`);
}

module.exports = { seedDatabase };
