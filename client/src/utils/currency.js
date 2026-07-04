// Bangladeshi Taka (BDT) currency helpers.
// Default currency for the whole CRM. Use these instead of hardcoded "$" / USD.

export const CURRENCY_CODE = "BDT";
export const CURRENCY_SYMBOL = "৳";

// Full amount, e.g. "৳ 1,25,000.00" (Bangladeshi/Indian digit grouping via en-IN).
export const formatBDT = (amount, { decimals = 2 } = {}) => {
  const n = Number(amount) || 0;
  return `${CURRENCY_SYMBOL} ${n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

// Compact form for charts/axes, e.g. "৳1.2L", "৳3.4Cr".
export const compactBDT = (amount) => {
  const n = Number(amount) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${CURRENCY_SYMBOL}${(n / 1e7).toFixed(1)}Cr`; // crore
  if (abs >= 1e5) return `${CURRENCY_SYMBOL}${(n / 1e5).toFixed(1)}L`; // lakh
  if (abs >= 1e3) return `${CURRENCY_SYMBOL}${(n / 1e3).toFixed(1)}K`;
  return `${CURRENCY_SYMBOL}${n.toFixed(0)}`;
};

// Number only (no symbol), grouped en-IN.
export const formatAmount = (amount, { decimals = 2 } = {}) => {
  const n = Number(amount) || 0;
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export default formatBDT;
