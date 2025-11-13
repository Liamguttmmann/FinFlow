export const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });

export const formatPercent = (value, { showSign = false, max = 999 } = {}) => {
  if (!Number.isFinite(value)) {
    return '>100%';
  }
  const limited = Math.min(Math.max(value, -max), max);
  const sign = showSign && limited > 0 ? '+' : '';
  return `${sign}${limited.toFixed(0)}%`;
};
