export function formatMoney(value: number) {
  return new Intl.NumberFormat('en-LC', {
    style: 'currency',
    currency: 'XCD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-LC', { maximumFractionDigits: 1 }).format(value || 0);
}

export function titleCase(input: string) {
  return input.replace(/_/g, ' ').replace(/\w/g, (m) => m.toUpperCase());
}
