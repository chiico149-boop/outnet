// Payment helpers: card validation (Luhn), brand detection, USDT address validation.
// NOTE: full card numbers / CVV are NEVER stored - only brand + last 4 digits.

function luhn(num) {
  const digits = String(num).replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function cardBrand(num) {
  const n = String(num).replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^6(011|5)/.test(n)) return 'Discover';
  return 'Card';
}

function validExpiry(exp) {
  const m = String(exp || '').match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  const year = 2000 + parseInt(m[2], 10);
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 0, 23, 59, 59);
  return end >= new Date();
}

function validateCard({ number, name, expiry, cvc }) {
  if (!name || name.trim().length < 2) return 'Cardholder name is required';
  if (!luhn(number)) return 'Invalid card number';
  if (!validExpiry(expiry)) return 'Invalid or expired expiry date (MM/YY)';
  if (!/^\d{3,4}$/.test(String(cvc || ''))) return 'Invalid CVC';
  return null;
}

const NETWORKS = ['TRC20', 'ERC20', 'BEP20'];

function validUsdtAddress(network, address) {
  const a = String(address || '').trim();
  if (network === 'TRC20') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(a);
  if (network === 'ERC20' || network === 'BEP20') return /^0x[a-fA-F0-9]{40}$/.test(a);
  return false;
}

function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ''));
}

function depositAddresses() {
  return {
    TRC20: process.env.USDT_TRC20 || '',
    ERC20: process.env.USDT_ERC20 || '',
    BEP20: process.env.USDT_BEP20 || '',
  };
}

module.exports = { luhn, cardBrand, validateCard, NETWORKS, validUsdtAddress, validEmail, depositAddresses };
