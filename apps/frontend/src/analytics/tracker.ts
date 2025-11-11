import { v4 as uuid } from 'uuid';
import { ApolloClient } from '@apollo/client';
import { RECORD_USER_EVENT } from '../graphql/userAnalytics';
import { getDeviceInfo } from '../utils/device';

export type AnalyticsEventType =
  | 'session_start'
  | 'page_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase'
  | 'customer_support_view';

export interface AnalyticsEventPayload {
  eventType: AnalyticsEventType;
  page?: string | null;
  productId?: string | null;
  source?: string | null;
  medium?: string | null;
  sessionId?: string | null;
  device?: string | null;
  country?: string | null;
  durationMs?: number | null;
}

type QueuedEvent = AnalyticsEventPayload & { createdAt: number };

const STORAGE_KEY = 'glamstore.analytics.session';
const MAX_QUEUE_SIZE = 20;
const FLUSH_INTERVAL = 4_000;
const MAX_RETRY = 3;
const RETRY_DELAY = 5_000;

function loadSessionId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = uuid();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch (error) {
    console.warn('Unable to access localStorage for analytics session.', error);
    return uuid();
  }
}

const sessionId = loadSessionId();

export class AnalyticsTracker {
  private queue: QueuedEvent[] = [];
  private client: ApolloClient<object>;
  private timer: number | null = null;
  private retryQueue: QueuedEvent[] = [];

  constructor(client: ApolloClient<object>) {
    this.client = client;
    this.scheduleFlush();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          void this.flushQueue();
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        void this.flushQueue();
      });
    }
  }

  record(event: AnalyticsEventPayload) {
    const deviceInfo = getDeviceInfo();
    const payload: QueuedEvent = {
      ...event,
      sessionId: sessionId,
      device: event.device ?? deviceInfo,
      createdAt: Date.now(),
    };
    this.queue.push(payload);
    const shouldFlushImmediately =
      event.eventType === 'product_view' ||
      event.eventType === 'product_click' ||
      event.eventType === 'add_to_cart';

    if (this.queue.length >= MAX_QUEUE_SIZE || shouldFlushImmediately) {
      void this.flushQueue();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(() => {
      void this.flushQueue();
    }, FLUSH_INTERVAL);
  }

  private async flushQueue() {
    if (this.queue.length === 0 && this.retryQueue.length === 0) {
      return;
    }

    const events = [...this.retryQueue.splice(0), ...this.queue.splice(0)];

    for (const event of events) {
      try {
        await this.client.mutate({
          mutation: RECORD_USER_EVENT,
          variables: {
            input: {
              eventType: event.eventType,
              sessionId: event.sessionId,
              page: event.page,
              productId: event.productId,
              source: event.source,
              medium: event.medium,
              device: event.device,
              country: event.country,
              durationMs: event.durationMs,
            },
          },
          fetchPolicy: 'no-cache',
        });
      } catch (error) {
        const attempt = (event as any).__retryAttempt ?? 0;
        if (attempt < MAX_RETRY) {
          (event as any).__retryAttempt = attempt + 1;
          setTimeout(
            () => {
              this.retryQueue.push(event);
              this.scheduleFlush();
            },
            RETRY_DELAY * (attempt + 1),
          );
        } else {
          console.warn(
            'Dropping analytics event after retries failed.',
            event,
            error,
          );
        }
      }
    }

    this.scheduleFlush();
  }
}

let trackerInstance: AnalyticsTracker | null = null;

export function initTracker(client: ApolloClient<object>) {
  if (!trackerInstance) {
    trackerInstance = new AnalyticsTracker(client);
  }
  return trackerInstance;
}

export function getTracker(client: ApolloClient<object>) {
  if (!trackerInstance) {
    return initTracker(client);
  }
  return trackerInstance;
}

export function trackPageView(client: ApolloClient<object>, page: string) {
  getTracker(client).record({
    eventType: 'page_view',
    page,
  });
}

export function trackProductView(
  client: ApolloClient<object>,
  productId: string,
) {
  getTracker(client).record({
    eventType: 'product_view',
    productId,
  });
}

export function trackProductClick(
  client: ApolloClient<object>,
  productId: string,
) {
  getTracker(client).record({
    eventType: 'product_click',
    productId,
  });
}

export function trackAddToCart(
  client: ApolloClient<object>,
  productId: string,
) {
  getTracker(client).record({
    eventType: 'add_to_cart',
    productId,
  });
}

export function trackCheckoutStart(client: ApolloClient<object>) {
  getTracker(client).record({
    eventType: 'checkout_start',
  });
}

export function trackPurchase(client: ApolloClient<object>, orderId?: string) {
  getTracker(client).record({
    eventType: 'purchase',
    productId: null,
    page: null,
  });
}
