import { gql, useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductModal from './ProductModal';
import Input from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Spinner from '../../components/ui/Spinner';
import { TProduct } from 'src/types';

const LIST_PRODUCTS = gql`
  query ListProductsPage(
    $page: Int!
    $pageSize: Int!
    $search: String
    $category: String
    $active: Boolean
    $outOfStock: Boolean
    $sortBy: String
    $sortDir: String
  ) {
    listProductsPage(
      page: $page
      pageSize: $pageSize

      search: $search
      category: $category
      active: $active
      outOfStock: $outOfStock
      sortBy: $sortBy
      sortDir: $sortDir
    ) {
      items {
        _id
        slug
        name
        sku
        brand
        description
        sizes
        colors
        category
        price
        salePrice
        stockQuantity
        images
        active
        featured
      }
      total
      page
      pageSize
      totalPages
    }
  }
`;
const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      _id
      name
      slug
      active
    }
  }
`;
const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export default function AdminDashboard() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [onlyActive, setOnlyActive] = useState<boolean | undefined>(undefined);
  const [onlyOut, setOnlyOut] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<string>('desc');
  const [q, setQ] = useState('');
  const { data, loading, refetch } = useQuery(LIST_PRODUCTS, {
    variables: {
      page,
      pageSize,
      search: q || undefined,
      category: categoryFilter || undefined,
      active: onlyActive,
      outOfStock: onlyOut,
      sortBy,
      sortDir,
    },
  });
  const { data: catsData } = useQuery(LIST_CATEGORIES);
  const [remove] = useMutation(DELETE_PRODUCT);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TProduct | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const pageData = data?.listProductsPage;
  const products = pageData?.items ?? [];
  // Open edit modal when navigated with ?productId=
  useEffect(() => {
    const pid = params.get('productId');
    if (!pid) return;
    const match = products.find((p: any) => String(p._id) === pid);
    if (match) {
      setEditing(match as TProduct);
      setModalOpen(true);
    } else {
      // Fallback: pass minimal product so ProductModal fetches full details itself
      setEditing({ _id: pid } as unknown as TProduct);
      setModalOpen(true);
    }
  }, [params, products]);
  const fmt = (n: number) => formatCurrency(n);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products;
    return products.filter((p: TProduct) =>
      [p.name, p.brand, p.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(t),
    );
  }, [products, q]);

  async function onDelete(id: string) {
    setToDeleteId(id);
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold theme-fg">
            Products Management
          </h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Manage your product catalog, inventory, and pricing
          </p>
        </div>
        <div className="px-2 py-6 border rounded-lg theme-card theme-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand">Products</span>
              <span className="border-brand text-brand bg-brand-50 rounded-full border px-2 py-0.5 text-xs">
                {filtered.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products..."
                className="w-64 text-sm focus-brand h-9"
              />
              <div className="w-48">
                <Select
                  value={categoryFilter}
                  onChange={(v) => {
                    setCategoryFilter(v);
                    setPage(1);
                  }}
                  options={[
                    { value: '', label: 'All Categories' },
                    ...((catsData?.listCategories ?? [])
                      .filter((c: any) => c.active)
                      .map((c: any) => ({
                        value: c.slug,
                        label: c.name,
                      })) as any[]),
                  ]}
                  className="text-sm"
                />
              </div>
              <div className="w-36">
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { value: 'createdAt', label: 'Newest' },
                    { value: 'price', label: 'Price' },
                    { value: 'name', label: 'Name' },
                    { value: 'stockQuantity', label: 'Stock' },
                  ]}
                  className="text-sm"
                />
              </div>
              <div className="w-28">
                <Select
                  value={sortDir}
                  onChange={setSortDir}
                  options={[
                    { value: 'desc', label: 'Desc' },
                    { value: 'asc', label: 'Asc' },
                  ]}
                  className="text-sm"
                />
              </div>
              <Checkbox
                checked={onlyActive === true}
                onChange={(v) => setOnlyActive(v ? true : undefined)}
                label={<span className="text-sm">Active</span>}
              />
              <Checkbox
                checked={onlyOut === true}
                onChange={(v) => setOnlyOut(v ? true : undefined)}
                label={<span className="text-sm">Out of stock</span>}
              />
              <button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
                className="px-3 text-sm rounded-md btn-primary h-9"
              >
                + Add Product
              </button>
            </div>
          </div>
          {loading ? (
            <div className="py-10">
              <Spinner label="Loading products" />
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-hidden border rounded-md theme-border">
                  <table className="w-full text-sm">
                    <thead className="table-head">
                      <tr className="text-left">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-border">
                      {filtered.map((p: TProduct, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 overflow-hidden bg-gray-100 border rounded theme-border">
                                {p.images?.[0] && (
                                  <img
                                    src={p.images[0]}
                                    className="object-cover w-full h-full"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{p.name}</div>
                                <div
                                  className="text-xs"
                                  style={{ color: 'rgb(var(--muted))' }}
                                >
                                  {p.brand || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize badge">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold">
                            {fmt(p.salePrice ?? p.price)}
                          </td>
                          <td className="px-4 py-3">
                            {p.stockQuantity && p.stockQuantity > 0 ? (
                              <span style={{ color: 'rgb(var(--muted))' }}>
                                {p.stockQuantity}
                              </span>
                            ) : (
                              <span
                                className="badge"
                                style={{
                                  color: '#b91c1c',
                                  borderColor: '#fecaca',
                                  backgroundColor: '#fee2e2',
                                }}
                              >
                                Out of stock
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`theme-border rounded-full border px-2 py-1 text-xs ${p.active ? '' : ''}`}
                            >
                              {p.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditing(p);
                                  setModalOpen(true);
                                }}
                                className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
                                aria-label="edit"
                                title="Edit"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => onDelete(p._id)}
                                className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
                                aria-label="delete"
                                title="Delete"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="py-10 text-center"
                            style={{ color: 'rgb(var(--muted))' }}
                          >
                            No results
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {filtered.length === 0 ? (
                  <div
                    className="py-10 text-sm text-center"
                    style={{ color: 'rgb(var(--muted))' }}
                  >
                    No results
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((p: TProduct, i: number) => (
                      <div
                        key={i}
                        className="p-4 border rounded-lg theme-border"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-16 h-16 overflow-hidden bg-gray-100 border rounded theme-border">
                            {p.images?.[0] && (
                              <img
                                src={p.images[0]}
                                className="object-cover w-full h-full"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 text-sm font-medium">
                              {p.name}
                            </div>
                            <div
                              className="mb-2 text-xs"
                              style={{ color: 'rgb(var(--muted))' }}
                            >
                              {p.brand || '—'}
                            </div>
                            <span className="text-xs capitalize badge">
                              {p.category}
                            </span>
                          </div>
                          <span
                            className={`theme-border rounded-full border px-2 py-1 text-xs ${p.active ? '' : ''}`}
                          >
                            {p.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              Price
                            </div>
                            <div className="text-sm font-semibold">
                              {fmt(p.salePrice ?? p.price)}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-gray-500">
                              Stock
                            </div>
                            <div className="text-sm">
                              {p.stockQuantity && p.stockQuantity > 0 ? (
                                <span style={{ color: 'rgb(var(--muted))' }}>
                                  {p.stockQuantity}
                                </span>
                              ) : (
                                <span
                                  className="text-xs badge"
                                  style={{
                                    color: '#b91c1c',
                                    borderColor: '#fecaca',
                                    backgroundColor: '#fee2e2',
                                  }}
                                >
                                  Out of stock
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditing(p);
                              setModalOpen(true);
                            }}
                            className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
                            aria-label="edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => onDelete(p._id)}
                            className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
                            aria-label="delete"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
              Page {pageData?.page ?? 1} of {pageData?.totalPages ?? 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 text-sm rounded-md btn-ghost h-9 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={pageData && page >= pageData.totalPages}
                onClick={() =>
                  setPage((p) =>
                    pageData ? Math.min(pageData.totalPages, p + 1) : p + 1,
                  )
                }
                className="px-3 text-sm rounded-md btn-primary h-9 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <ProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          const next = new URLSearchParams(params);
          next.delete('productId');
          setParams(next, { replace: true });
        }}
        initial={editing}
        onSaved={() => refetch()}
      />
      <ConfirmModal
        open={toDeleteId !== null}
        title="Delete product?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={async () => {
          if (toDeleteId) {
            await remove({ variables: { id: toDeleteId } });
            await refetch();
          }
        }}
        onClose={() => setToDeleteId(null)}
      />
    </>
  );
}
