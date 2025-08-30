import { useQuery } from '@apollo/client';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ME } from '../../graphql/auth';
import { AccessToken } from '../../enums/access-token';

export default function AdminLayout() {
  const {
    user,
    logout,
    loginWithRedirect,
    isAuthenticated,
    getAccessTokenSilently,
  } = useAuth0();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [backendToken, setBackendToken] = useState<string | null>(() =>
    localStorage.getItem(AccessToken.KEY),
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const { data: meData, refetch: refetchMe } = useQuery(ME, {
    fetchPolicy: 'cache-and-network',
    skip: !backendToken,
  });

  const tabs = [
    { to: '/admin', label: 'Products', end: true },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/orders', label: 'Orders' },
  ];
  return (
    <div className="theme-bg theme-fg">
      <header className="border-b theme-border bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between max-w-6xl px-4 py-4 mx-auto">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-full"
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
          <nav className="items-center hidden gap-6 text-sm md:flex">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/categories">Categories</Link>
          </nav>
          <div className="flex items-center gap-4">
            <button
              className="transition-opacity opacity-80 hover:opacity-100"
              aria-label="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
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
            <button
              className="transition-opacity opacity-80 hover:opacity-100"
              aria-label="Bag"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
              >
                <path d="M6 7h12l-1 12H7L6 7z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
            </button>
            <div className="relative" ref={menuRef}>
              <button
                className="transition-opacity opacity-80 hover:opacity-100"
                aria-label="Account"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="8" r="3" />
                  <path d="M6 20a6 6 0 0 1 12 0" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 w-56 p-2 bg-white border rounded-lg shadow-lg theme-card top-9">
                  {user ? (
                    <>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-brand-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="w-4 h-4"
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
                        className="flex items-center w-full gap-2 px-3 py-2 text-sm text-left rounded hover:bg-brand-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          className="w-4 h-4"
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
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-brand-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="w-4 h-4"
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
      <main className="max-w-6xl px-4 py-8 mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="inline-flex items-center gap-2 p-1 mt-4 bg-white border rounded-md theme-border">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end as any}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm ${isActive ? 'btn-primary' : ''}`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
