export function getDeviceInfo(): string {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }
  const ua = navigator.userAgent || '';
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  if (/iPad|Android|Touch/.test(ua)) return 'tablet';
  return 'desktop';
}
