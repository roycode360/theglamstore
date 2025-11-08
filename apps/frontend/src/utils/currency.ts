export type FormatCurrencyOptions = {
  locale?: string
  currency?: string
}

/**
 * Formats a numeric amount as currency (default NGN – Nigerian Naira).
 * Always displays 2 decimal places for consistency.
 */
export function formatCurrency(amount: number, options?: FormatCurrencyOptions): string {
  const locale = options?.locale ?? 'en-NG'
  const currency = options?.currency ?? 'NGN'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback formatting if Intl fails
    const symbol = currency === 'NGN' ? '₦' : ''
    return `${symbol}${(amount ?? 0).toFixed(2)}`
  }
}


