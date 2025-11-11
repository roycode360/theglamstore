export type ActivityPeriod = 'daily' | 'weekly';

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '0';
  return Number(value).toLocaleString('en-US');
}

export function secondsFromMillis(value: number | null | undefined): string {
  if (!value || value <= 0) return '0s';
  const seconds = Math.round(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder > 0 ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

