import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export const Header = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    (to === '/' && pathname === '/') || (to !== '/' && pathname.startsWith(to));

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, logout, login, isUserAuthenticated } = useAuth();
  const { cartItemCount } = useCart();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <header className="theme-border relative z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-2 py-4 sm:px-4">
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
        <nav className="hidden items-center gap-3 text-sm md:flex">
          {[
            { href: '/', label: 'Home' },
            { href: '/products', label: 'Products' },
            { href: '/categories', label: 'Categories' },
          ].map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={
                isActive(item.href)
                  ? 'theme-border text-brand bg-brand-50 inline-flex items-center rounded-full border px-3 py-1.5 font-semibold'
                  : 'hover:bg-brand-50 inline-flex items-center rounded-full px-3 py-1.5'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              title="Admin Dashboard"
              className="text-brand theme-border hover:bg-brand-50 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
            >
              <span className="hidden sm:inline">Admin</span>
              <span aria-hidden>⚙️</span>
            </Link>
          )}
          <div className="relative">
            <Link
              to="/cart"
              className="opacity-80 transition-opacity hover:opacity-100"
              aria-label="Bag"
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
              {/* Cart Badge */}
              {cartItemCount > 0 && (
                <span
                  className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'rgb(var(--brand-700))',
                    borderColor: 'rgb(var(--border))',
                  }}
                >
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
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
              <div className="theme-card absolute right-0 top-9 z-[9999] w-56 rounded-lg border bg-white p-2 shadow-lg">
                {isUserAuthenticated ? (
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
                    <Link
                      to="/account/wishlist"
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
                        <path d="M12 21s-6.716-4.39-9.193-7.63C1.49 11.66 1 9.93 1 8.5 1 6.015 3.015 4 5.5 4c1.54 0 3.04.79 3.9 2.06C10.46 4.79 11.96 4 13.5 4 15.985 4 18 6.015 18 8.5c0 1.43-.49 3.16-1.807 4.87C18.716 16.61 12 21 12 21z" />
                      </svg>
                      <span>My Wishlist</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
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
                    onClick={() => {
                      setMenuOpen(false);
                      login();
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
  );
};
