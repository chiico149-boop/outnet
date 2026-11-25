# THE OUT FIT — Fashion Dropshipping Marketplace

Multi-seller fashion marketplace: **Node.js + Express + MongoDB**, vanilla HTML/CSS/JS frontend. Ready for **Vercel**.

---

## 🚀 Deploy on Vercel (step by step)

### 1. Create a free MongoDB database (MongoDB Atlas)
1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Create a **free M0 cluster**.
3. **Database Access** → *Add New Database User* → choose a username + password (avoid special characters like `@ : / ?`).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`). *(Required: Vercel has no fixed IP.)*
5. **Database → Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/theoutfit?retryWrites=true&w=majority`
   Replace `<password>` with your password and add `/theoutfit` before the `?`.

### 2. Put the code on GitHub
Upload **all** files of this folder to your repository (including `vercel.json`, `app.js`, `.gitignore`).

### 3. Import in Vercel
1. <https://vercel.com/new> → import your GitHub repo. Framework preset: **Express** (auto-detected) — leave build settings empty.
2. **Settings → Environment Variables** — add:

| Name | Value | Required |
|------|-------|----------|
| `MONGO_URI` | your Atlas connection string | ✅ |
| `JWT_SECRET` | any long random text | recommended |
| `ADMIN_USER` | `admin` | optional |
| `ADMIN_PASS` | `admin1212` | optional |
| `USDT_TRC20` / `USDT_ERC20` / `USDT_BEP20` | your USDT wallet addresses (TRC20 defaults to TJAmBhkPcgF26FasQ1VwYbKygcL2z5ndZt) | optional |
| `PAYPAL_RECEIVER_EMAIL` | your PayPal email | optional |

3. **Deployments → ⋯ → Redeploy** (environment variables only apply after a redeploy).

### 4. Check it works
- Open `https://YOUR-SITE.vercel.app/api/health` → should show `"ok": true` and `"db": "connected"`.
  If not, the `error` field tells you exactly what's wrong (usually the MONGO_URI or Atlas Network Access).
- The **first request fills the empty database automatically** with categories, 24 products, reviews, 4 demo sellers and the admin account (takes ~10 s once).

---

## Logins
| Role | URL | Credentials |
|------|-----|-------------|
| Admin (hidden, not linked) | `/the-outfit-admin` | `admin` / `admin1212` (or your `ADMIN_USER`/`ADMIN_PASS`) |
| Demo seller | `/login.html` | `elan@theoutfit.com` / `seller123` (also `urban@`, `luxe@`, `stride@`) |

> ⚠️ Change the admin password and set `JWT_SECRET` before going live. The admin account is created on first start; to change its password later, delete the admin user in MongoDB and redeploy.

## Run locally
```bash
npm install
cp .env.example .env     # edit MONGO_URI if needed (default: local MongoDB)
npm run seed             # optional: reset demo data
npm start                # http://localhost:3000
```

## Features
- Home page: hero, categories, featured products, listings per category, top sellers
- 8 fashion categories, 24 products with photos, prices, sizes and star reviews, each sold by a specific seller
- Seller signup/login (MongoDB, bcrypt, JWT cookie)
- Seller dashboard: listings with photo upload, **Choose products** from the supplier catalog, wallet deposit/withdraw via **PayPal** and **USDT TRC20** (network, address, QR code, TXID), payment info, orders
- Public seller shop with **Report seller** button, cart & checkout
- Hidden admin panel: stats, sellers (deposit, block, report, delete), approve/reject transactions, reports, listings, catalog, orders

## Payments
Payments are recorded as **pending** and approved by the admin (deposits credit the balance; withdrawals are held and refunded if rejected). To charge real money, connect Stripe / PayPal Checkout / a crypto gateway in `routes/wallet.js` and `routes/shop.js`.

## Structure
```
app.js          Express app (Vercel entry, exported)
server.js       Local entry (npm start)
vercel.json     Vercel rewrites (hidden admin URL)
seed.js         Reset demo data (npm run seed)
models/         User, Category, Product, Review, Transaction, Order, Image
routes/         auth, shop (public), seller, wallet, admin
middleware/     auth (JWT cookies), upload (multer, memory)
utils/          db connection, seed data, payments, images, admin bootstrap
public/         Pages, CSS, JS, product images, the-outfit-admin.html
```
