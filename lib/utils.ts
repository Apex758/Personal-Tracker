export function safeNumber(value: unknown) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function safeString(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value);
}
