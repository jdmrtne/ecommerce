const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

/** Formats a peso amount consistently everywhere a price is shown. */
export function formatPHP(amount: number): string {
  return PESO.format(amount);
}
