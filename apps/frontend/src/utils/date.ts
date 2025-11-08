/**
 * Format a date to 12-hour format with AM/PM
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "12/25/2024, 3:45:30 PM")
 */
export function formatDate(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date to date-only format (no time)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string (e.g., "12/25/2024")
 */
export function formatDateOnly(date: string | Date | number): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

