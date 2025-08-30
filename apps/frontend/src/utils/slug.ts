/**
 * Generates a URL-safe slug from a source string.
 * Rules:
 * - lowercase
 * - spaces -> '-'
 * - remove special characters
 * - collapse repeated dashes
 * - trim leading/trailing dashes
 */
export function generateSlug(source: string): string {
  if (!source) return ''
  const slug = source
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}+/gu, '') // remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug
}


