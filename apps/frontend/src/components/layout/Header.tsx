import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { brandLogo } from 'src/assets/images';

export const Header = () => {
  const { pathname } = useLocation();
  const isActive = (to: string) =>
    (to === '/' && pathname === '/') || (to !== '/' && pathname.startsWith(to));

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();
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
    <header className="relative z-40 border-b theme-border bg-white/80 backdrop-blur">
      <div className="flex items-center justify-between px-2 py-4 mx-auto max-w-7xl sm:px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img src={brandLogo} alt="TheGlamStore" className="w-52" />
        </Link>
        <nav className="items-center hidden gap-3 text-sm md:flex">
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
              className="transition-opacity opacity-80 hover:opacity-100"
              aria-label="Bag"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-6 h-6"
              >
                <path d="M6 7h12l-1 12H7L6 7z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
              {/* Cart Badge */}
              {cartItemCount > 0 && (
                <span
                  className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white border rounded-full -right-2 -top-2"
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
              className="transition-opacity opacity-80 hover:opacity-100"
              aria-label="Account"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {isUserAuthenticated ? (
                user?.avatar ? (
                  <img
                    src={user.avatar}
                    // alt={user.fullName || 'User avatar'}
                    className="object-cover w-6 h-6 border rounded-full theme-border"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[10px] font-semibold text-white">
                    {(user?.fullName || 'U')
                      .split(' ')
                      .map((name) => name[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                )
              ) : (
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
              )}
            </button>
            {menuOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className="theme-card absolute right-0 top-9 z-[9999] w-64 rounded-xl border bg-white p-2 shadow-xl"
              >
                {/* caret */}
                <div className="absolute w-4 h-4 rotate-45 bg-white border border-b-0 border-r-0 rounded-sm pointer-events-none -top-2 right-6" />
                {isUserAuthenticated ? (
                  <>
                    {/* header */}
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName || 'User avatar'}
                          className="object-cover w-8 h-8 rounded-full"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold text-white bg-black rounded-full">
                          {(user?.fullName || 'U')
                            .split(' ')
                            .map((name) => name[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {user?.email}
                        </div>
                        <div
                          className="text-xs truncate"
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          Signed in
                        </div>
                      </div>
                    </div>
                    <div
                      className="my-2 border-t"
                      style={{ borderColor: 'rgb(var(--border))' }}
                    />
                    <Link
                      to="/orders"
                      role="menuitem"
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
                    <Link
                      to="/account/wishlist"
                      role="menuitem"
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
                        <path d="M12 21s-6.716-4.39-9.193-7.63C1.49 11.66 1 9.93 1 8.5 1 6.015 3.015 4 5.5 4c1.54 0 3.04.79 3.9 2.06C10.46 4.79 11.96 4 13.5 4 15.985 4 18 6.015 18 8.5c0 1.43-.49 3.16-1.807 4.87C18.716 16.61 12 21 12 21z" />
                      </svg>
                      <span>My Wishlist</span>
                    </Link>
                    <div
                      className="my-2 border-t"
                      style={{ borderColor: 'rgb(var(--border))' }}
                    />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      role="menuitem"
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
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/login', { state: { from: pathname } });
                    }}
                    role="menuitem"
                    className="flex items-center w-full gap-2 px-3 py-2 text-sm rounded hover:bg-brand-50"
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
  );
};
