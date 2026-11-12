export type PaymentScheme = "full" | "installment_3";

export function buildInstallmentAmounts(total: number, scheme: PaymentScheme): number[] {
  if (scheme === "full") return [total];

  const rounded = Math.round(total);
  const base = Math.floor(rounded / 3);
  const remainder = rounded - base * 3;

  return [base + (remainder >= 1 ? 1 : 0), base + (remainder >= 2 ? 1 : 0), base];
}
