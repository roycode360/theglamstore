import { useQuery } from '@apollo/client';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ME } from '../../graphql/auth';
import { GET_PENDING_ORDERS_COUNT } from '../../graphql/orders';
import { AccessToken } from '../../enums/access-token';
import { AuthLoadingModal } from '../ui/AuthLoadingModal';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminLayout() {
  const { loading, authStep, isLoginProcess } = useAuth();
  const location = useLocation();

  // Get pending orders count for the badge
  const { data: pendingOrdersData } = useQuery<{
    getPendingOrdersCount: number;
  }>(GET_PENDING_ORDERS_COUNT, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // Poll every 30 seconds to keep count updated
  });

  const pendingOrdersCount = pendingOrdersData?.getPendingOrdersCount || 0;
  const tabs = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      end: true,
    },
    {
      to: '/admin/products',
      label: 'Products',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M3 6l9-4 9 4v8l-9 4-9-4V6z" />
          <path d="M3 6l9 4 9-4" />
          <path d="M12 10v8" />
          <rect x="8" y="12" width="8" height="6" rx="1" />
        </svg>
      ),
    },
    {
      to: '/admin/categories',
      label: 'Categories',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      ),
    },
    {
      to: '/admin/orders',
      label: 'Orders',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          <path d="M3 6h2l2.4 9.6A2 2 0 0 0 9.35 17H17a2 2 0 0 0 1.94-1.52L20.5 9H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="20" cy="20" r="1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="theme-bg theme-fg">
      <main className="mx-auto max-w-7xl px-2 py-8 sm:px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="mt-4 w-full sm:inline-block sm:w-auto">
            <div className="theme-border flex items-center justify-between gap-1 rounded-md border bg-white p-1 sm:justify-start sm:gap-2">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end as any}
                  className={({ isActive }) =>
                    `flex items-center justify-center rounded-md px-2 py-2 text-sm transition-colors sm:px-3 sm:py-1.5 ${isActive ? 'btn-primary' : ''}`
                  }
                  title={t.label}
                >
                  <div className="relative">
                    <span className="sm:hidden">{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    {/* Show badge for orders tab when there are pending orders */}
                    {t.to === '/admin/orders' && pendingOrdersCount > 0 && (
                      <span
                        className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold"
                        style={{
                          backgroundColor:
                            location.pathname === '/admin/orders'
                              ? 'rgb(var(--brand-100))'
                              : 'rgb(var(--brand-700))',
                          color:
                            location.pathname === '/admin/orders'
                              ? 'rgb(var(--brand-900))'
                              : 'white',
                          borderColor:
                            location.pathname === '/admin/orders'
                              ? 'rgb(var(--brand-300))'
                              : 'rgb(var(--brand-700))',
                        }}
                      >
                        {pendingOrdersCount}
                      </span>
                    )}
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
        <Outlet />
      </main>
      <AuthLoadingModal isOpen={loading && isLoginProcess} step={authStep} />
    </div>
  );
}
