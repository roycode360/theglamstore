import { gql, useMutation, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import ProductModal from './ProductModal';
import Input from '../../components/ui/Input';
import { formatCurrency } from '../../utils/currency';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Spinner from '../../components/ui/Spinner';

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
        id
        name
        brand
        category
        price
        salePrice
        stockQuantity
        images
        active
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
      id
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
  const [editing, setEditing] = useState<any | null>(null);
  const [toDeleteId, setToDeleteId] = useState<string | null>(null);
  const pageData = data?.listProductsPage;
  const products = pageData?.items ?? [];
  const fmt = (n: number) => formatCurrency(n);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products;
    return products.filter((p: any) =>
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
          <h1 className="theme-fg text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
            Manage your fashion store content
          </p>
        </div>
        <div className="theme-card theme-border rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-brand font-semibold">Products</span>
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
                className="focus-brand h-9 w-64 text-sm"
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
                className="btn-primary h-9 rounded-md px-3 text-sm"
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
            <div className="theme-border overflow-hidden rounded-md border">
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
                <tbody className="theme-border divide-y">
                  {filtered.map((p: any) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="theme-border h-10 w-10 overflow-hidden rounded border bg-gray-100">
                            {p.images?.[0] && (
                              <img
                                src={p.images[0]}
                                className="h-full w-full object-cover"
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
                        <span className="badge capitalize">
                          {p.category || 'uncategorized'}
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
                            className="theme-border hover:bg-brand-50 text-brand flex h-8 w-8 items-center justify-center rounded border bg-white"
                            aria-label="edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="theme-border hover:bg-brand-50 text-brand flex h-8 w-8 items-center justify-center rounded border bg-white"
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
          )}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
              Page {pageData?.page ?? 1} of {pageData?.totalPages ?? 1}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-ghost h-9 rounded-md px-3 text-sm disabled:opacity-50"
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
                className="btn-primary h-9 rounded-md px-3 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
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
