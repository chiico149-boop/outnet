// Payment helpers: USDT address validation, deposit addresses, email validation.
// Supported methods: PayPal and USDT (card payments removed).

// Default USDT TRC20 deposit wallet (can be overridden with the USDT_TRC20 environment variable)
const DEFAULT_TRC20 = 'TJAmBhkPcgF26FasQ1VwYbKygcL2z5ndZt';

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

// All configured deposit addresses
function depositAddresses() {
  return {
    TRC20: process.env.USDT_TRC20 || DEFAULT_TRC20,
    ERC20: process.env.USDT_ERC20 || '',
    BEP20: process.env.USDT_BEP20 || '',
  };
}

// Only the networks that actually have a deposit address
function depositNetworks() {
  const a = depositAddresses();
  return NETWORKS.filter((n) => a[n]);
}

module.exports = { NETWORKS, validUsdtAddress, validEmail, depositAddresses, depositNetworks };
