import React from 'react';
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
import RootLayout from './components/layout/AppLayout';
import HomePage from './routes/HomePage';
import ProductCategories from './routes/ProductCategories';
import ProductDetails from './routes/ProductDetails';
import CartPage from './routes/CartPage';
import CheckoutPage from './routes/CheckoutPage';
import OrderConfirmation from './routes/OrderConfirmation';
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './routes/admin/DashboardPage';
import AdminDashboard from './routes/admin/AdminDashboard';
import ProductsPage from './routes/ProductsPage';
import OrdersPage from './routes/admin/OrdersPage';
import CustomersPage from './routes/admin/CustomersPage';
import SettingsPage from './routes/admin/SettingsPage';
import { ThemeProvider } from './theme';
import { ToastProvider } from './components/ui/Toast';
import { CartProvider } from './contexts/CartContext';
import AdminCategoriesPage from './routes/admin/AdminCategoriesPage';
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

const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'categories', element: <ProductCategories /> },
          { path: 'ProductDetails', element: <ProductDetails /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'checkout/confirmation', element: <OrderConfirmation /> },
          { path: 'not-authorized', element: <NotAuthorized /> },
          { path: 'customer-service', element: <CustomerService /> },
        ],
      },
      {
        path: '/admin',
        element: <RequireAuth roles={['admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'products', element: <AdminDashboard /> },
              { path: 'categories', element: <AdminCategoriesPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      {
        path: '/orders',
        element: <RequireAuth roles={['customer', 'admin']} />,
        children: [
          {
            element: <AppLayout />, // keep site header/footer
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
        children: [
          {
            element: <AppLayout />,
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
