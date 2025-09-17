import { useQuery } from '@apollo/client';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ME } from '../../graphql/auth';
import { AccessToken } from '../../enums/access-token';

export default function AdminLayout() {
  const tabs = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/orders', label: 'Orders' },
  ];

  return (
    <div className="theme-bg theme-fg">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <div className="theme-border mt-4 inline-flex items-center gap-2 rounded-md border bg-white p-1">
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
