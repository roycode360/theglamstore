export type GenerateSkuOptions = {
  maxSegmentLength?: number
}

/**
 * Generates a base SKU string using the format: {CATEGORY}-{PRODUCTNAME}-{RANDOM4DIGITS}
 * - CATEGORY and PRODUCTNAME are uppercased and stripped of spaces/special characters
 * - RANDOM4DIGITS is a number in the range 1000-9999
 */
export function generateBaseSKU(
  category: string,
  productName: string,
  options?: GenerateSkuOptions,
): string {
  const sanitize = (value: string): string => value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')

  const limit = (value: string): string => {
    const max = options?.maxSegmentLength
    if (max && max > 0) return value.slice(0, max)
    return value
  }

  const categorySegment = limit(sanitize(category || 'CAT')) || 'CAT'
  const nameSegment = limit(sanitize(productName || 'ITEM')) || 'ITEM'
  const random = Math.floor(1000 + Math.random() * 9000) // 1000-9999

  return `${categorySegment}-${nameSegment}-${random}`
}


