import { useQuery } from '@apollo/client';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ME } from '../../graphql/auth';
import { GET_PENDING_ORDERS_COUNT } from '../../graphql/orders';
import { LIST_PENDING_REVIEWS } from '../../graphql/reviews';
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
  const { data: pendingReviewsData } = useQuery<{
    listPendingReviews: Array<{ _id: string }>;
  }>(LIST_PENDING_REVIEWS, {
    variables: { limit: 50 },
    fetchPolicy: 'network-only',
    pollInterval: 30000,
  });
  const pendingReviewsCount =
    pendingReviewsData?.listPendingReviews?.length || 0;
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
          className="w-5 h-5"
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
          className="w-5 h-5"
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
          className="w-5 h-5"
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
          className="w-5 h-5"
        >
          <path d="M3 6h2l2.4 9.6A2 2 0 0 0 9.35 17H17a2 2 0 0 0 1.94-1.52L20.5 9H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="20" cy="20" r="1" />
        </svg>
      ),
    },
    {
      to: '/admin/analytics',
      label: 'Analytics',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path d="M3 3v18h18" />
          <path d="M7 12l4-4 4 4 6-6" />
          <path d="M21 12h-6v6" />
        </svg>
      ),
    },
    {
      to: '/admin/reviews',
      label: 'Reviews',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ),
    },
    {
      to: '/admin/settings',
      label: 'Settings',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.06A1.65 1.65 0 0 0 10 4.11V4a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.06A1.65 1.65 0 0 0 20 12.91h.09a2 2 0 1 1 0 4H20a1.65 1.65 0 0 0-.6-.09 1.65 1.65 0 0 0-.63.18z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="theme-bg theme-fg">
      <main className="px-2 py-8 mx-auto max-w-7xl sm:px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="w-full mt-4 sm:inline-block sm:w-auto">
            <div className="flex items-center justify-between gap-1 p-1 bg-white border rounded-md theme-border sm:justify-start sm:gap-2">
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
                        className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-semibold border rounded-full -right-2 -top-2"
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
                    {t.to === '/admin/reviews' && pendingReviewsCount > 0 && (
                      <span
                        className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-semibold border rounded-full -right-2 -top-2"
                        style={{
                          backgroundColor:
                            location.pathname === '/admin/reviews'
                              ? 'rgb(var(--brand-100))'
                              : 'rgb(var(--brand-700))',
                          color:
                            location.pathname === '/admin/reviews'
                              ? 'rgb(var(--brand-900))'
                              : 'white',
                          borderColor:
                            location.pathname === '/admin/reviews'
                              ? 'rgb(var(--brand-300))'
                              : 'rgb(var(--brand-700))',
                        }}
                      >
                        {pendingReviewsCount}
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
