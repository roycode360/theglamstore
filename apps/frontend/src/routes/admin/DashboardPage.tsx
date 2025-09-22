import { gql, useQuery } from '@apollo/client';
import Spinner from '../../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const LIST_ORDERS = gql`
  query ListOrdersForDashboard {
    listOrders {
      _id
      createdAt
      total
      status
      paymentMethod
      email
      firstName
      lastName
      items {
        productId
        name
        price
        quantity
        image
      }
    }
  }
`;

const LIST_PRODUCTS = gql`
  query ListProductsForDashboard {
    listProducts {
      _id
      name
      images
      price
      salePrice
      stockQuantity
    }
  }
`;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: ordersData, loading: ordersLoading } = useQuery(LIST_ORDERS, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: productsData, loading: productsLoading } = useQuery(
    LIST_PRODUCTS,
    { fetchPolicy: 'cache-and-network' },
  );

  const statusClasses: Record<string, string> = {
    pending: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    confirmed: 'bg-blue-50 border-blue-200 text-blue-800',
    processing: 'bg-amber-50 border-amber-200 text-amber-800',
    shipped: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    delivered: 'bg-green-50 border-green-200 text-green-800',
    cancelled: 'bg-red-50 border-red-200 text-red-800',
  };

  const orders = ordersData?.listOrders ?? [];
  const products = productsData?.listProducts ?? [];

  const totalRevenue: number = orders
    .filter((o: any) => o.status !== 'pending' && o.status !== 'cancelled')
    .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
  const totalOrders: number = orders.length;
  const totalProducts: number = products.length;
  const lowStockItems: number = products.filter(
    (p: any) => typeof p.stockQuantity === 'number' && p.stockQuantity <= 5,
  ).length;

  const recentOrders = [...orders]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Build a very light sparkline for this month's sales totals
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const salesPerDay: number[] = Array.from({ length: daysInMonth }, () => 0);
  orders.forEach((o: any) => {
    const d = new Date(o.createdAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const idx = d.getDate() - 1;
      salesPerDay[idx] += Number(o.total) || 0;
    }
  });
  const maxVal = Math.max(1, ...salesPerDay);
  const width = 700;
  const height = 220;
  const margin = { top: 24, right: 12, bottom: 28, left: 96 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const stepX = innerWidth / (daysInMonth - 1 || 1);
  const pointsXY = salesPerDay.map((v, i) => {
    const x = margin.left + i * stepX;
    const y = margin.top + innerHeight - (v / maxVal) * innerHeight;
    return { x, y };
  });

  function toSmoothPath(pts: { x: number; y: number }[]) {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    const d: string[] = [`M ${pts[0].x} ${pts[0].y}`];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i === 0 ? pts[0] : pts[i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i + 2 < pts.length ? pts[i + 2] : p2;
      const tension = 0.2;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;
      d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(' ');
  }

  const pathD = toSmoothPath(pointsXY);
  const areaD = pointsXY.length
    ? `${pathD} L ${pointsXY[pointsXY.length - 1].x} ${
        margin.top + innerHeight
      } L ${pointsXY[0].x} ${margin.top + innerHeight} Z`
    : '';

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Aggregate top selling products by units sold (fallback to revenue)
  const topSelling = (() => {
    const salesByProduct: Record<
      string,
      {
        productId: string;
        name?: string;
        image?: string;
        units: number;
        revenue: number;
      }
    > = {};
    orders.forEach((o: any) => {
      (o.items ?? []).forEach((it: any) => {
        const productId = String(it.productId);
        const units = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        const revenue = units * price;
        const existing = salesByProduct[productId] || {
          productId,
          name: it.name,
          image: it.image,
          units: 0,
          revenue: 0,
        };
        existing.units += units;
        existing.revenue += revenue;
        salesByProduct[productId] = existing;
      });
    });
    return Object.values(salesByProduct).sort(
      (a, b) => b.units - a.units || b.revenue - a.revenue,
    );
  })();

  function truncateId(id: string, max: number = 22): string {
    if (!id) return '';
    return id.length > max ? id.slice(0, max) + '…' : id;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold theme-fg">Admin Panel</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Manage your fashion store and view key metrics
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 border rounded-lg theme-card theme-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Revenue
              </div>
              <div className="mt-2 text-2xl font-semibold">
                ₦
                {Number(totalRevenue).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
            <div className="flex items-center justify-center bg-white border rounded-full theme-border text-brand h-9 w-9">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
              >
                <rect x="2.75" y="6.75" width="18.5" height="10.5" rx="2" />
                <circle cx="12" cy="12" r="2.5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg theme-card theme-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Orders
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalOrders}</div>
            </div>
            <div className="flex items-center justify-center bg-white border rounded-full theme-border text-brand h-9 w-9">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
              >
                <path d="M3 6h2l2.4 9.6A2 2 0 0 0 9.35 17H17a2 2 0 0 0 1.94-1.52L20.5 9H6" />
                <circle cx="9.5" cy="19" r="1.5" />
                <circle cx="17.5" cy="19" r="1.5" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg theme-card theme-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Total Products
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalProducts}</div>
            </div>
            <div className="flex items-center justify-center bg-white border rounded-full theme-border text-brand h-9 w-9">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
              >
                <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
                <path d="M12 12 20 8" />
                <path d="M12 12v9" />
                <path d="M12 12 4 8" />
              </svg>
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg theme-card theme-border">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                Low Stock Items
              </div>
              <div className="mt-2 text-2xl font-semibold">{lowStockItems}</div>
            </div>
            <div className="flex items-center justify-center bg-white border rounded-full theme-border text-brand h-9 w-9">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-5 h-5"
              >
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18.14A2 2 0 0 0 3.55 21h16.9a2 2 0 0 0 1.73-2.86L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="p-6 border rounded-lg theme-card theme-border md:col-span-2">
          <div className="mb-3 text-lg font-semibold">Sales This Month</div>
          {ordersLoading ? (
            <div className="py-10">
              <Spinner label="Loading sales" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <svg width={width} height={height} className="text-brand">
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.28"
                    />
                    <stop
                      offset="60%"
                      stopColor="currentColor"
                      stopOpacity="0.12"
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0.04"
                    />
                  </linearGradient>
                </defs>
                {/* Axes */}
                <line
                  x1={margin.left}
                  y1={margin.top}
                  x2={margin.left}
                  y2={margin.top + innerHeight}
                  stroke="#e5e7eb"
                />
                <line
                  x1={margin.left}
                  y1={margin.top + innerHeight}
                  x2={margin.left + innerWidth}
                  y2={margin.top + innerHeight}
                  stroke="#e5e7eb"
                />

                {/* Y ticks */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const t = (i + 1) / 4;
                  const y = margin.top + innerHeight - t * innerHeight;
                  const value = Math.round((t * maxVal) / 1000) * 1000;
                  return (
                    <g key={i}>
                      <line
                        x1={margin.left - 4}
                        x2={margin.left + innerWidth}
                        y1={y}
                        y2={y}
                        stroke="#f1f5f9"
                      />
                      <text
                        x={margin.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#6b7280"
                      >
                        ₦{Number(value).toLocaleString()}
                      </text>
                    </g>
                  );
                })}

                {/* X ticks */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  if (i % Math.ceil(daysInMonth / 10) !== 0) return null;
                  const x = margin.left + i * stepX;
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        x2={x}
                        y1={margin.top + innerHeight}
                        y2={margin.top + innerHeight + 4}
                        stroke="#e5e7eb"
                      />
                      <text
                        x={x}
                        y={margin.top + innerHeight + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#6b7280"
                      >
                        {i + 1}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path d={areaD} fill="url(#salesGradient)" stroke="none" />

                {/* Smoothed Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                {/* Hover cursor + tooltip */}
                {hoverIdx !== null && (
                  <g>
                    <line
                      x1={margin.left + hoverIdx * stepX}
                      x2={margin.left + hoverIdx * stepX}
                      y1={margin.top}
                      y2={margin.top + innerHeight}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={margin.left + hoverIdx * stepX}
                      cy={
                        margin.top +
                        innerHeight -
                        ((salesPerDay[hoverIdx] || 0) / maxVal) * innerHeight
                      }
                      r={3.5}
                      fill="#fff"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <rect
                      x={Math.min(
                        margin.left + hoverIdx * stepX + 8,
                        margin.left + innerWidth - 120,
                      )}
                      y={margin.top + 8}
                      width="120"
                      height="36"
                      rx="6"
                      fill="#111827"
                      opacity="0.9"
                    />
                    <text
                      x={Math.min(
                        margin.left + hoverIdx * stepX + 16,
                        margin.left + innerWidth - 112,
                      )}
                      y={margin.top + 24}
                      fontSize="11"
                      fill="#fff"
                    >
                      {`Day ${hoverIdx + 1}: ₦${Number(
                        salesPerDay[hoverIdx] || 0,
                      ).toLocaleString()}`}
                    </text>
                  </g>
                )}

                {/* Transparent capture area for hover */}
                <rect
                  x={margin.left}
                  y={margin.top}
                  width={innerWidth}
                  height={innerHeight}
                  fill="transparent"
                  onMouseMove={(e) => {
                    const bounds = (
                      e.target as SVGRectElement
                    ).getBoundingClientRect();
                    const px = e.clientX - bounds.left;
                    const idx = Math.round((px - margin.left) / stepX);
                    setHoverIdx(Math.max(0, Math.min(daysInMonth - 1, idx)));
                  }}
                  onMouseLeave={() => setHoverIdx(null)}
                />
                {/* Legend (inside chart area) */}
                <g
                  transform={`translate(${margin.left + 6}, ${margin.top + 6})`}
                  pointerEvents="none"
                >
                  <rect
                    x={0}
                    y={-4}
                    width={10}
                    height={4}
                    rx={2}
                    fill="url(#salesGradient)"
                  />
                  <line
                    x1={0}
                    y1={-2}
                    x2={26}
                    y2={-2}
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <text x={32} y={2} fontSize="11" fill="#6b7280">
                    Sales
                  </text>
                </g>
              </svg>
            </div>
          )}
        </div>
        <div className="p-6 border rounded-lg theme-card theme-border">
          <div className="mb-3 text-lg font-semibold">Top Selling Products</div>
          {ordersLoading ? (
            <div className="py-6">
              <Spinner label="Loading products" />
            </div>
          ) : (
            <div className="space-y-3">
              {topSelling.slice(0, 3).map((row: any) => (
                <div
                  key={row.productId}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-brand-50"
                  onClick={() =>
                    navigate(`/admin/products?productId=${row.productId}`)
                  }
                  role="button"
                  aria-label={`View product ${row.productId}`}
                >
                  <div className="flex items-center flex-1 min-w-0 gap-2">
                    <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 rounded">
                      {row.image && (
                        <img
                          src={row.image}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-1">
                        {row.name || row.productId}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        {row.units} units sold · ₦
                        {Number(row.revenue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div
                    className="hidden flex-shrink-0 self-start pt-0.5 text-xs sm:block"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    ID:{' '}
                    <span className="inline-block max-w-[120px] truncate align-bottom">
                      {truncateId(row.productId)}
                    </span>
                  </div>
                </div>
              ))}
              {topSelling.length === 0 && (
                <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
                  No products
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-2 py-6 border rounded-lg theme-card theme-border">
        <div className="mb-3 text-lg font-semibold">Recent Orders</div>
        {ordersLoading ? (
          <div className="py-6">
            <Spinner label="Loading orders" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-hidden border rounded-md theme-border">
                <table className="w-full text-sm">
                  <thead className="table-head">
                    <tr className="text-left">
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border">
                    {recentOrders.map((o: any) => (
                      <tr
                        key={o._id}
                        className="cursor-pointer hover:bg-brand-50"
                        onClick={() => navigate(`/admin/orders?id=${o._id}`)}
                        role="button"
                        aria-label={`View order ${o._id}`}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{o._id}</td>
                        <td className="px-4 py-3">
                          {new Date(o.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs ${statusClasses[o.status] ?? 'theme-border'}`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-right">
                          ₦{Number(o.total).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {recentOrders.length === 0 && (
                      <tr>
                        <td
                          className="py-8 text-center"
                          colSpan={4}
                          style={{ color: 'rgb(var(--muted))' }}
                        >
                          No recent orders
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {recentOrders.length === 0 ? (
                <div
                  className="py-8 text-sm text-center"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  No recent orders
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((o: any) => (
                    <div
                      key={o._id}
                      className="px-2 py-4 border rounded-lg cursor-pointer theme-border hover:bg-brand-50"
                      onClick={() => navigate(`/admin/orders?id=${o._id}`)}
                      role="button"
                      aria-label={`View order ${o._id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 font-mono text-xs text-gray-500">
                            Order ID
                          </div>
                          <div className="font-mono text-sm truncate">
                            {o._id}
                          </div>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${statusClasses[o.status] ?? 'theme-border'}`}
                        >
                          {o.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="mb-1 text-xs text-gray-500">Date</div>
                          <div className="text-sm">
                            {new Date(o.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              },
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs text-gray-500">
                            Total
                          </div>
                          <div className="text-sm font-semibold">
                            ₦{Number(o.total).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
