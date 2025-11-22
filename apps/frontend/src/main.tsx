import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { initTracker } from './analytics/tracker';
import RootLayout from './components/layout/AppLayout';
import HomePage from './routes/HomePage';
import ProductCategories from './routes/ProductCategories';
import ProductDetails from './routes/ProductDetails';
import LoginPage from './routes/LoginPage';
import PrivacyPolicy from './routes/PrivacyPolicy';
import TermsOfService from './routes/TermsOfService';
import CartPage from './routes/CartPage';
import CheckoutPage from './routes/CheckoutPage';
import OrderConfirmation from './routes/OrderConfirmation';
import ProductsPage from './routes/ProductsPage';
import { ThemeProvider } from './theme';
import { ToastProvider } from './components/ui/Toast';
import { CartProvider } from './contexts/CartContext';
import AdminLayout from './components/layout/AdminLayout';
import RequireAuth from './routes/RequireAuth';
import NotAuthorized from './routes/NotAuthorized';
import { Auth0Provider } from '@auth0/auth0-react';
import { AccessToken } from './enums/access-token';
import { Header } from './components/layout/Header';
import AppLayout from './components/layout/AppLayout';
import MainLayout from './components/layout/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import { CheckoutProvider } from './contexts/CheckoutContext';
import CustomerOrdersPage from './routes/account/CustomerOrdersPage';
import CustomerOrderDetailsPage from './routes/account/CustomerOrderDetailsPage';
import CustomerService from './routes/CustomerService';
import WishlistPage from './routes/account/WishlistPage';
import { WishlistProvider } from './contexts/WishlistContext';
import PageLoader from './components/ui/PageLoader';
import ErrorPage from './routes/ErrorPage';

const DashboardPage = lazy(() => import('./routes/admin/DashboardPage'));
const AdminDashboard = lazy(() => import('./routes/admin/AdminDashboard'));
const OrdersPage = lazy(() => import('./routes/admin/OrdersPage'));
const AdminCreateOrderPage = lazy(
  () => import('./routes/admin/AdminCreateOrderPage'),
);
const AdminOrderReceiptPage = lazy(
  () => import('./routes/admin/AdminOrderReceiptPage'),
);
const CustomersPage = lazy(() => import('./routes/admin/CustomersPage'));
const SettingsPage = lazy(() => import('./routes/admin/SettingsPage'));
const AdminUserAnalyticsPage = lazy(
  () => import('./routes/admin/AdminUserAnalyticsPage'),
);
const RevenueAnalyticsPage = lazy(
  () => import('./routes/admin/RevenueAnalyticsPage'),
);
const AdminReviewsPage = lazy(() => import('./routes/admin/AdminReviewsPage'));
const AdminCategoriesPage = lazy(
  () => import('./routes/admin/AdminCategoriesPage'),
);

const httpLink = new HttpLink({
  uri:
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_GRAPHQL_URL ||
    'http://localhost:3000/graphql',
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem(AccessToken.KEY);
  return {
    headers: {
      ...headers,
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Global error interceptor: logout on unauthenticated/forbidden and toast
let sessionHandled = false; // avoid duplicate toasts per page load
let isInitialLoad = true; // track if this is the initial page load

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  const hasToken = !!localStorage.getItem(AccessToken.KEY);
  if (!hasToken) return; // only react if user previously had a token

  // Don't show session expired on initial load or during auth queries
  const isAuthQuery =
    operation?.operationName === 'Me' ||
    operation?.operationName === 'LoginWithAuth0';

  if (isInitialLoad || isAuthQuery) {
    return;
  }

  const gqlUnauth = (graphQLErrors || []).some((err) => {
    const code = (err?.extensions as any)?.code;
    const msg = (err?.message || '').toLowerCase();
    return (
      code === 'UNAUTHENTICATED' ||
      code === 'FORBIDDEN' ||
      msg.includes('unauthenticated') ||
      msg.includes('forbidden')
    );
  });

  const netStatus =
    (networkError as any)?.statusCode || (networkError as any)?.status;
  const netUnauth = netStatus === 401 || netStatus === 403;

  if ((gqlUnauth || netUnauth) && !sessionHandled) {
    sessionHandled = true;
    localStorage.removeItem(AccessToken.KEY);
    window.dispatchEvent(new CustomEvent('app:session-expired'));
  }
});

// Mark initial load as complete after a short delay
setTimeout(() => {
  isInitialLoad = false;
}, 2000);

const client = new ApolloClient({
  link: from([errorLink, authLink.concat(httpLink)]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

const tracker = initTracker(client);
tracker.record({
  eventType: 'session_start',
  page: typeof window !== 'undefined' ? window.location.pathname : undefined,
});

const withSuspense = (
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
  label?: string,
) => (
  <Suspense fallback={<PageLoader label={label} />}>
    <Component />
  </Suspense>
);

const defaultErrorElement = <ErrorPage />;

const router = createBrowserRouter([
  {
    path: '/orders/:id/receipt',
    element: withSuspense(AdminOrderReceiptPage),
    errorElement: defaultErrorElement,
  },
  {
    element: <MainLayout />,
    errorElement: defaultErrorElement,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        errorElement: defaultErrorElement,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'categories', element: <ProductCategories /> },
          { path: 'ProductDetails', element: <ProductDetails /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'privacy-policy', element: <PrivacyPolicy /> },
          { path: 'terms-of-service', element: <TermsOfService /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/confirmation', element: <OrderConfirmation /> },
          { path: 'wishlist', element: <WishlistPage /> },
          { path: 'not-authorized', element: <NotAuthorized /> },
          { path: 'customer-service', element: <CustomerService /> },
        ],
      },
      {
        path: '/admin',
        element: <RequireAuth roles={['admin']} />,
        errorElement: defaultErrorElement,
        children: [
          {
            element: <AdminLayout />,
            errorElement: defaultErrorElement,
            children: [
              { index: true, element: withSuspense(DashboardPage) },
              { path: 'dashboard', element: withSuspense(DashboardPage) },
              { path: 'products', element: withSuspense(AdminDashboard) },
              {
                path: 'categories',
                element: withSuspense(AdminCategoriesPage),
              },
              { path: 'orders', element: withSuspense(OrdersPage) },
              {
                path: 'orders/new',
                element: withSuspense(AdminCreateOrderPage),
              },
              {
                path: 'analytics',
                element: withSuspense(RevenueAnalyticsPage),
              },
              {
                path: 'user-analytics',
                element: withSuspense(
                  AdminUserAnalyticsPage,
                  'Loading analytics…',
                ),
              },
              { path: 'reviews', element: withSuspense(AdminReviewsPage) },
              { path: 'customers', element: withSuspense(CustomersPage) },
              { path: 'settings', element: withSuspense(SettingsPage) },
            ],
          },
        ],
      },
      {
        path: '/orders',
        element: <RequireAuth roles={['customer', 'admin']} />,
        errorElement: defaultErrorElement,
        children: [
          {
            element: <AppLayout />, // keep site header/footer
            errorElement: defaultErrorElement,
            children: [
              { index: true, element: <CustomerOrdersPage /> },
              { path: ':id', element: <CustomerOrderDetailsPage /> },
            ],
          },
        ],
      },
      {
        path: '/account',
        element: <RequireAuth roles={['customer', 'admin']} />,
        errorElement: defaultErrorElement,
        children: [
          {
            element: <AppLayout />,
            errorElement: defaultErrorElement,
            children: [{ path: 'wishlist', element: <WishlistPage /> }],
          },
        ],
      },
    ],
  },
]);

// Wire session-expired toast listener
function SessionExpiredListener() {
  React.useEffect(() => {
    function onExpired() {
      // Lazy import to avoid circular import
      const evt = new CustomEvent('toast:show', {
        detail: {
          message: 'Your session has expired. Please sign in again.',
          type: 'warning',
          title: 'Session expired',
        },
      });
      window.dispatchEvent(evt);
    }
    window.addEventListener('app:session-expired', onExpired);
    return () => window.removeEventListener('app:session-expired', onExpired);
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <ThemeProvider>
        <ToastProvider>
          <SessionExpiredListener />
          <Auth0Provider
            domain={import.meta.env.VITE_AUTH0_DOMAIN}
            clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
            authorizationParams={{
              redirect_uri: import.meta.env.VITE_WEB_APP_ORIGIN,
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            }}
            useRefreshTokens={true}
            cacheLocation="localstorage"
            useRefreshTokensFallback={false}
          >
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <CheckoutProvider>
                    <RouterProvider router={router} />
                  </CheckoutProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </Auth0Provider>
        </ToastProvider>
      </ThemeProvider>
    </ApolloProvider>
  </React.StrictMode>,
);
