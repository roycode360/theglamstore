import { useCallback, useEffect } from 'react';
import { useApolloClient } from '@apollo/client';
import {
  getTracker,
  trackAddToCart as trackAddToCartEvent,
  trackCheckoutStart as trackCheckoutStartEvent,
  trackPageView as trackPageViewEvent,
  trackProductClick as trackProductClickEvent,
  trackProductView as trackProductViewEvent,
  trackPurchase as trackPurchaseEvent,
} from '../analytics/tracker';

export function useAnalyticsTracker() {
  const client = useApolloClient();

  useEffect(() => {
    getTracker(client);
  }, [client]);

  const trackPageView = useCallback(
    (page: string) => {
      trackPageViewEvent(client, page);
    },
    [client],
  );

  const trackProductView = useCallback(
    (productId: string) => {
      trackProductViewEvent(client, productId);
    },
    [client],
  );

  const trackAddToCart = useCallback(
    (productId: string) => {
      trackAddToCartEvent(client, productId);
    },
    [client],
  );

  const trackProductClick = useCallback(
    (productId: string) => {
      trackProductClickEvent(client, productId);
    },
    [client],
  );

  const trackCheckoutStart = useCallback(() => {
    trackCheckoutStartEvent(client);
  }, [client]);

  const trackPurchase = useCallback(() => {
    trackPurchaseEvent(client);
  }, [client]);

  return {
    trackPageView,
    trackProductView,
    trackProductClick,
    trackAddToCart,
    trackCheckoutStart,
    trackPurchase,
  };
}
