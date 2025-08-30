export type FormatCurrencyOptions = {
  locale?: string
  currency?: string
}

/**
 * Formats a numeric amount as currency (default NGN – Nigerian Naira).
 */
export function formatCurrency(amount: number, options?: FormatCurrencyOptions): string {
  const locale = options?.locale ?? 'en-NG'
  const currency = options?.currency ?? 'NGN'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount)
  } catch {
    // Fallback formatting if Intl fails
    const symbol = currency === 'NGN' ? '₦' : ''
    return `${symbol}${(amount ?? 0).toFixed(2)}`
  }
}


