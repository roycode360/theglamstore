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
  authStep: string;
  isLoginProcess: boolean;
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
  const [authStep, setAuthStep] = useState<string>('');
  const [isLoginProcess, setIsLoginProcess] = useState(false);
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
    isAuthenticated: isAuth0Authenticated,
    isLoading: isAuth0Loading,
  } = useAuth0();

  const login = async () => {
    try {
      setLoading(true);
      setIsLoginProcess(true);
      setAuthStep('Redirecting to login...');
      // First we login with redirect using Auth0
      await loginWithRedirect({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });
      console.log('loginWithRedirect');
    } catch (error) {
      // ignore and leave user unauthenticated on backend
      console.log('login error', error);
      setError('Login failed. Please try again.');
      setAuthStep('');
      setIsLoginProcess(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMe = async (showLoadingModal = false) => {
    const token = localStorage.getItem(AccessToken.KEY);
    if (!token) return;

    try {
      setLoading(true);
      if (showLoadingModal) {
        setAuthStep('Loading user profile...');
      }
      const { data } = await client.query<{ me: TAuthUser }>({
        query: ME,
        fetchPolicy: 'cache-first', // Use cache first to avoid unnecessary network calls
        errorPolicy: 'all', // Don't throw on errors, let us handle them
      });

      if (data?.me) {
        setUser(data.me);
        setError(null);
        if (showLoadingModal) {
          setAuthStep('Loading your data...');
          await prefetchOrders();
          setAuthStep('Welcome back!');
          // Clear the step after a short delay
          setTimeout(() => {
            setAuthStep('');
            setIsLoginProcess(false);
          }, 1000);
        } else {
          await prefetchOrders();
        }
      }
    } catch (err: any) {
      console.log('fetchMe error:', err);
      setAuthStep('');
      setIsLoginProcess(false);
      // Only set error if it's not a network/auth error
      const isAuthError =
        err?.message?.includes('UNAUTHENTICATED') ||
        err?.message?.includes('FORBIDDEN') ||
        err?.networkError?.statusCode === 401 ||
        err?.networkError?.statusCode === 403;

      if (!isAuthError) {
        setError(err.message || 'Failed to fetch user');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AccessToken.KEY);
    setError(null);
    setLoading(false);
    setAuthStep('');
    setIsLoginProcess(false);

    // Logout from Auth0 with proper redirect
    logoutAuth0({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  const value: TAuthContext = {
    user,
    loading: loading || isAuth0Loading,
    error,
    authStep,
    isLoginProcess,
    login,
    logout,
    fetchMe,
    isUserAuthenticated,
  };

  // Initial load - check for existing authentication
  useEffect(() => {
    const initializeAuth = async () => {
      const existingToken = localStorage.getItem(AccessToken.KEY);

      if (existingToken) {
        // User has a backend token, fetch user data (silently, no modal)
        try {
          setLoading(true);
          await fetchMe(false); // Don't show loading modal for session verification
        } catch (error) {
          console.log('Failed to fetch user with existing token:', error);
          // Token might be invalid, clear it
          localStorage.removeItem(AccessToken.KEY);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else if (isAuth0Authenticated && !isAuth0Loading) {
        // User is authenticated with Auth0 but no backend token (this is a login process)
        try {
          setLoading(true);
          setIsLoginProcess(true);
          setAuthStep('Processing your login...');

          // Get Auth0 token
          setAuthStep('Getting your authentication token...');
          const auth0Token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            },
          });

          if (auth0Token) {
            // Exchange Auth0 token for backend token
            setAuthStep('Setting up your account...');
            const { data } = await exchangeToken({ variables: { auth0Token } });
            const backendToken = data?.loginWithAuth0?.accessToken;

            if (backendToken) {
              localStorage.setItem(AccessToken.KEY, backendToken);
              setUser(data?.loginWithAuth0?.user as TAuthUser);
              setError(null);
              setAuthStep('Loading your profile...');
              await fetchMe(true); // Show loading modal for login process
              setAuthStep('Welcome!');
              setTimeout(() => {
                setAuthStep('');
                setIsLoginProcess(false);
              }, 1000);
            }
          }
        } catch (error) {
          console.log('Auth0 token exchange error:', error);
          setAuthStep('');
          setIsLoginProcess(false);
          setError('Authentication failed. Please try again.');
        } finally {
          setLoading(false);
        }
      } else if (!isAuth0Loading) {
        // User is not authenticated
        setUser(null);
        setError(null);
        setAuthStep('');
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isAuth0Authenticated, isAuth0Loading]);

  // Handle Auth0 authentication state changes (only when state actually changes)
  useEffect(() => {
    const handleAuth0StateChange = async () => {
      // Only handle state changes, not initial load
      if (isAuth0Loading) {
        setLoading(true);
        return;
      }

      if (isAuth0Authenticated) {
        const existingToken = localStorage.getItem(AccessToken.KEY);
        if (existingToken) {
          // Already have backend token, just fetch user data
          try {
            setLoading(true);
            await fetchMe();
          } catch (error) {
            console.log('Failed to fetch user data:', error);
          } finally {
            setLoading(false);
          }
        } else {
          // Need to exchange Auth0 token for backend token
          try {
            setLoading(true);

            const auth0Token = await getAccessTokenSilently({
              authorizationParams: {
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              },
            });

            if (auth0Token) {
              const { data } = await exchangeToken({
                variables: { auth0Token },
              });
              const backendToken = data?.loginWithAuth0?.accessToken;

              if (backendToken) {
                localStorage.setItem(AccessToken.KEY, backendToken);
                setUser(data?.loginWithAuth0?.user as TAuthUser);
                setError(null);
                await fetchMe();
                await prefetchOrders();
              }
            }
          } catch (error) {
            console.log('Auth0 state change error:', error);
            setError('Authentication failed. Please try again.');
          } finally {
            setLoading(false);
          }
        }
      } else {
        // User is not authenticated with Auth0
        setUser(null);
        localStorage.removeItem(AccessToken.KEY);
        setError(null);
        setLoading(false);
      }
    };

    // Only run this effect when Auth0 state actually changes, not on initial load
    if (isAuth0Authenticated !== undefined) {
      handleAuth0StateChange();
    }
  }, [isAuth0Authenticated, isAuth0Loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};
