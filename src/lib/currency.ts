// Centralized SAR currency formatting.
// Format: "SAR 1,234.56" (en-US grouping, 2 decimals).

const nf = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const nfInt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatSAR(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!isFinite(n)) return "SAR 0.00";
  return `SAR ${nf.format(n)}`;
}

export function formatSARInt(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  if (!isFinite(n)) return "SAR 0";
  return `SAR ${nfInt.format(n)}`;
}
