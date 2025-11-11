import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalyticsTracker } from '../../hooks/useAnalyticsTracker';

export default function AnalyticsRouterListener() {
  const location = useLocation();
  const { trackPageView } = useAnalyticsTracker();

  useEffect(() => {
    const pathname = location.pathname || window.location.pathname;
    trackPageView(pathname);
  }, [location.pathname, trackPageView]);

  return null;
}
