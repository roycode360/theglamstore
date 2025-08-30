import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import RootLayout from './routes/RootLayout';
import HomePage from './routes/HomePage';
import ProductCategories from './routes/ProductCategories';
import ProductDetails from './routes/ProductDetails';
import CartPage from './routes/CartPage';
import AdminLayout from './routes/admin/AdminLayout';
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

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
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

const client = new ApolloClient({
  link: authLink.concat(httpLink),
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
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'categories', element: <ProductCategories /> },
      { path: 'ProductDetails', element: <ProductDetails /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'not-authorized', element: <NotAuthorized /> },
    ],
  },
  {
    path: '/admin',
    element: <RequireAuth roles={['admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <ThemeProvider>
        <ToastProvider>
          <CartProvider>
            <Auth0Provider
              domain={import.meta.env.VITE_AUTH0_DOMAIN}
              clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
              authorizationParams={{
                redirect_uri: import.meta.env.VITE_WEB_APP_ORIGIN,
              }}
            >
              <RouterProvider router={router} />
            </Auth0Provider>
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
    </ApolloProvider>
  </React.StrictMode>,
);
