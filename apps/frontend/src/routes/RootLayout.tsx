import { Link, Outlet, useLocation } from 'react-router-dom';
// import { ThemeToggle } from '../theme';
import { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { AccessToken } from '../enums/access-token';
import { gql, useApolloClient, useMutation, useQuery } from '@apollo/client';
import { ME } from '../graphql/auth';
import { useCart } from '../contexts/CartContext';

export default function RootLayout() {
  const {
    user,
    logout,
    loginWithRedirect,
    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();

  const { cartItemCount } = useCart();

  const { pathname } = useLocation();
  const isActive = (to: string) =>
    (to === '/' && pathname === '/') || (to !== '/' && pathname.startsWith(to));
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticatingUser, setIsAuthenticatingUser] = useState(false);
  const [backendToken, setBackendToken] = useState<string | null>(() =>
    localStorage.getItem(AccessToken.KEY),
  );
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const LOGIN_WITH_AUTH0 = gql`
    mutation LoginWithAuth0($auth0Token: String!) {
      loginWithAuth0(auth0Token: $auth0Token) {
        accessToken
        refreshToken
        user {
          id
          email
          role
        }
      }
    }
  `;

  const apollo = useApolloClient();
  const [exchangeToken] = useMutation(LOGIN_WITH_AUTH0);
  const { data: meData, refetch: refetchMe } = useQuery(ME, {
    fetchPolicy: 'cache-and-network',
    skip: !backendToken,
  });

  useEffect(() => {
    (async () => {
      if (!isAuthenticated) {
        localStorage.removeItem(AccessToken.KEY);
        return;
      }
      try {
        setIsAuthenticatingUser(true);
        const auth0Token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          },
        });
        const { data } = await exchangeToken({ variables: { auth0Token } });
        const backendToken = data?.loginWithAuth0?.accessToken as
          | string
          | undefined;
        if (backendToken) {
          localStorage.setItem(AccessToken.KEY, backendToken);
          setBackendToken(backendToken);
          // ensure ME is repopulated after we have a backend token
          try {
            await apollo.refetchQueries({ include: ['Me'] });
          } catch {}
        }
      } catch (err) {
        console.log('err', err);
        // ignore and leave user unauthenticated on backend
      } finally {
        setIsAuthenticatingUser(false);
      }
    })();
  }, [isAuthenticated, getAccessTokenSilently, exchangeToken, apollo]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'rgb(var(--brand-200))',
                color: 'rgb(var(--brand-800))',
              }}
            >
              👜
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              TheGlamStore
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-8 md:flex">
            {[
              { to: '/', label: 'Home' },
              { to: '/products', label: 'Products' },
              { to: '/categories', label: 'Categories' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="relative pb-2 text-sm"
              >
                <span className={isActive(item.to) ? 'font-semibold' : ''}>
                  {item.label}
                </span>
                {isActive(item.to) && (
                  <span
                    className="absolute inset-x-0 -bottom-[1px] mx-auto h-[2px] w-8 rounded-full"
                    style={{ backgroundColor: 'rgb(var(--brand-700))' }}
                  />
                )}
              </Link>
            ))}
            {/* Admin link moved to right side (replacing theme toggle) */}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            <button
              className="opacity-80 transition-opacity hover:opacity-100"
              aria-label="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
            </button>
            {meData?.me?.role === 'admin' && (
              <Link
                to="/admin"
                title="Admin Dashboard"
                className="text-brand theme-border hover:bg-brand-50 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
              >
                <span className="hidden sm:inline">Admin</span>
                <span aria-hidden>⚙️</span>
              </Link>
            )}
            <Link
              to="/cart"
              className="relative opacity-80 transition-opacity hover:opacity-100"
              aria-label="Shopping Cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-5 w-5"
              >
                <path d="M6 7h12l-1 12H7L6 7z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              {cartItemCount > 0 && (
                <span className="bg-brand absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                className="opacity-80 transition-opacity hover:opacity-100"
                aria-label="Account"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <circle cx="12" cy="8" r="3" />
                  <path d="M6 20a6 6 0 0 1 12 0" />
                </svg>
              </button>
              {menuOpen && (
                <div className="theme-card absolute right-0 top-9 w-56 rounded-lg border bg-white p-2 shadow-lg">
                  {user ? (
                    <>
                      <Link
                        to="/orders"
                        className="hover:bg-brand-50 flex items-center gap-2 rounded px-3 py-2 text-sm"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="h-4 w-4"
                        >
                          <path d="M3 7l9-4 9 4-9 4-9-4z" />
                          <path d="M3 7v10l9 4 9-4V7" />
                        </svg>
                        <span>My Orders</span>
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout({
                            logoutParams: {
                              returnTo: import.meta.env.VITE_WEB_APP_ORIGIN,
                            },
                          });
                        }}
                        className="hover:bg-brand-50 flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="h-4 w-4"
                        >
                          <path d="M9 12h10" />
                          <path d="M15 16l4-4-4-4" />
                          <path d="M5 19V5" />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await loginWithRedirect();
                      }}
                      className="hover:bg-brand-50 flex items-center gap-2 rounded px-3 py-2 text-sm"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-4 w-4"
                      >
                        <path d="M15 12H3" />
                        <path d="M7 16l-4-4 4-4" />
                        <path d="M21 19V5" />
                      </svg>
                      <span>Login</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="my-16 border-t bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'rgb(var(--brand-200))',
                  color: 'rgb(var(--brand-800))',
                }}
              >
                👜
              </span>
              <span className="font-semibold">TheGlamStore</span>
            </div>
            <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
              Discover the finest fashion pieces curated for the modern
              lifestyle. Quality craftsmanship meets contemporary design.
            </p>
          </div>
          <div>
            <div className="mb-2 font-semibold">Quick Links</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/admin/products">Products</Link>
              </li>
              <li>
                <Link to="/admin/categories">Categories</Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 font-semibold">Support</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#">Customer Service</a>
              </li>
              <li>
                <a href="#">Size Guide</a>
              </li>
              <li>
                <a href="#">Returns</a>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="mx-auto mt-7 max-w-7xl px-4 pb-10 text-center text-xs"
          style={{ color: 'rgb(var(--muted))' }}
        >
          © 2024 TheGlamStore. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
