import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { useAuth0 } from '@auth0/auth0-react';
import { createContext, useContext, useEffect, useState } from 'react';
import { AccessToken } from '../enums/access-token';
import { LOGIN_WITH_AUTH0, ME } from '../graphql/auth';
import { LIST_ORDERS } from '../graphql/orders';

interface TAuthUser {
  _id: string;
  email: string;
  role: 'customer' | 'admin';
}

interface TAuthContext {
  user: TAuthUser | null;
  loading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  fetchMe: () => void;
  isUserAuthenticated: boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<TAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<TAuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUserAuthenticated = !!localStorage.getItem(AccessToken.KEY);

  const client = useApolloClient();

  const prefetchOrders = async () => {
    const token = localStorage.getItem(AccessToken.KEY);
    if (!token) return;
    try {
      await client.query({ query: LIST_ORDERS, fetchPolicy: 'network-only' });
    } catch (e) {
      // ignore prefetch errors; global errorLink handles auth issues
    }
  };

  const [exchangeToken] = useMutation<{
    loginWithAuth0: { accessToken: string; user: TAuthUser };
  }>(LOGIN_WITH_AUTH0);

  const {
    logout: logoutAuth0,
    getAccessTokenSilently,
    loginWithRedirect,
  } = useAuth0();

  const login = async () => {
    try {
      // First we login with redirect using Auth0
      await loginWithRedirect();
      console.log('loginWithRedirect');
    } catch (error) {
      // ignore and leave user unauthenticated on backend
      console.log('logout error', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async () => {
    const token = localStorage.getItem(AccessToken.KEY);
    if (!token) return;

    try {
      setLoading(true);
      const { data } = await client.query<{ me: TAuthUser }>({
        query: ME,
        fetchPolicy: 'network-only',
      });
      setUser(data?.me || null);
      await prefetchOrders();
    } catch (err: any) {
      // Do not force logout here; global errorLink handles 401/403
      setError(err.message || 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AccessToken.KEY);
    logoutAuth0();
    setLoading(false);
    setError(null);
  };

  const value: TAuthContext = {
    user,
    loading,
    error,
    login,
    logout,
    fetchMe,
    isUserAuthenticated,
  };

  useEffect(() => {
    fetchMe();
    const initializeAuth = async () => {
      // Then we send the user details from Auth0 to the backend to create/fetch the user details along with a backend token
      const auth0Token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });

      if (!auth0Token) {
        return;
      }

      const { data } = await exchangeToken({ variables: { auth0Token } });
      const backendToken = data?.loginWithAuth0?.accessToken;
      if (backendToken) {
        localStorage.setItem(AccessToken.KEY, backendToken);
        setUser(data?.loginWithAuth0?.user as TAuthUser);
        setError(null);
        fetchMe();
        prefetchOrders();
      }
    };

    initializeAuth();
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
