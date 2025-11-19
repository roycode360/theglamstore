import { gql, useMutation, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import Input from '../../components/ui/Input';
import CategoryModal, { type Category } from './CategoryModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  function truncateText(text?: string, max = 120) {
    if (!text) return '';
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  const LIST_CATEGORIES = gql`
    query ListCategories {
      listCategories {
        _id
        name
        slug
        description
        image
        sortOrder
        parentId
        active
      }
    }
  `;
  const CREATE_CATEGORY = gql`
    mutation CreateCategory($input: CreateCategoryInput!) {
      createCategory(input: $input) {
        _id
        name
        slug
        description
        image
        sortOrder
        parentId
        active
      }
    }
  `;

  const UPDATE_CATEGORY = gql`
    mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
      updateCategory(id: $id, input: $input) {
        _id
        name
        slug
        description
        image
        sortOrder
        parentId
        active
      }
    }
  `;
  const DELETE_CATEGORY = gql`
    mutation DeleteCategory($id: ID!) {
      deleteCategory(id: $id)
    }
  `;

  const { data, loading, refetch } = useQuery(LIST_CATEGORIES);
  const [createCat] = useMutation(CREATE_CATEGORY);
  const [updateCat] = useMutation(UPDATE_CATEGORY);
  const [deleteCat] = useMutation(DELETE_CATEGORY);
  const cats: Category[] = (data?.listCategories as any) ?? [];

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return cats;
    return cats.filter((c) =>
      [c.name, c.slug].join(' ').toLowerCase().includes(t),
    );
  }, [q, cats]);

  async function upsertCategory(cat: Category) {
    try {
      if (editing) {
        await updateCat({
          variables: {
            id: editing._id,
            input: {
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              image: cat.image,
              sortOrder: cat.sortOrder,
              parentId: cat.parentId ?? null,
              active: cat.active,
            },
          },
        });
        showToast('Category updated', 'success');
      } else {
        await createCat({
          variables: {
            input: {
              name: cat.name,
              slug: cat.slug,
              description: cat.description,
              image: cat.image,
              sortOrder: cat.sortOrder,
              parentId: cat.parentId ?? null,
              active: cat.active,
            },
          },
        });
        showToast('Category created', 'success');
      }
      await refetch();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save category';
      showToast(msg, 'error');
      throw err;
    }
  }

  async function removeCategory(id: string) {
    try {
      await deleteCat({ variables: { id } });
      await refetch();
      showToast('Category deleted', 'success');
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete category';
      showToast(msg, 'error');
    }
  }

  const initialLoading = loading && !data?.listCategories;

  return (
    <div className="theme-card theme-border rounded-lg border px-2 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-brand font-semibold">Categories</span>
          <span className="border-brand text-brand bg-brand-50 rounded-full border px-2 py-0.5 text-xs">
            {filtered.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories..."
            className="focus-brand h-9 w-full text-sm sm:w-64"
          />
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn-primary h-9 rounded-md px-3 text-sm"
          >
            + Add Category
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-md">
        {initialLoading ? (
          <CategoriesSkeleton />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="table-head">
                  <tr className="text-left">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Sort Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="theme-border divide-y">
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="theme-border h-10 w-10 overflow-hidden rounded border bg-gray-100">
                            {c.image && (
                              <img
                                src={c.image}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div
                              className="text-xs"
                              style={{ color: 'rgb(var(--muted))' }}
                              title={c.description || ''}
                            >
                              {truncateText(c.description, 140)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                          {c.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="theme-border inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                          {c.sortOrder}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`theme-border rounded-full border px-2 py-1 text-xs ${c.active ? '' : ''}`}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditing(c);
                              setModalOpen(true);
                            }}
                            className="theme-border hover:bg-brand-50 text-brand flex h-8 w-8 items-center justify-center rounded border bg-white"
                            aria-label="edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setToDelete(c._id)}
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
                        colSpan={5}
                        className="py-10 text-center"
                        style={{ color: 'rgb(var(--muted))' }}
                      >
                        No categories found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {filtered.length === 0 ? (
                <div
                  className="py-10 text-center text-sm"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  No categories found
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((c) => (
                    <div
                      key={c._id}
                      className="theme-border rounded-lg border p-4"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <div className="theme-border h-16 w-16 flex-shrink-0 overflow-hidden rounded border bg-gray-100">
                          {c.image && (
                            <img
                              src={c.image}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-sm font-medium">
                            {c.name}
                          </div>
                          <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                            {c.slug}
                          </code>
                        </div>
                        <span
                          className={`theme-border rounded-full border px-2 py-1 text-xs ${c.active ? '' : ''}`}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Sort Order:
                          </span>
                          <span className="theme-border inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                            {c.sortOrder}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(c);
                              setModalOpen(true);
                            }}
                            className="theme-border hover:bg-brand-50 text-brand flex h-8 w-8 items-center justify-center rounded border bg-white"
                            aria-label="edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setToDelete(c._id)}
                            className="theme-border hover:bg-brand-50 text-brand flex h-8 w-8 items-center justify-center rounded border bg-white"
                            aria-label="delete"
                            title="Delete"
                          >
                            🗑
                          </button>
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
      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        categories={cats}
        onSave={upsertCategory}
      />
      <ConfirmModal
        open={toDelete !== null}
        title="Delete category?"
        message="This action cannot be undone."
        confirmText="Delete"
        onConfirm={async () => {
          if (toDelete) removeCategory(toDelete);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function CategoriesSkeleton() {
  const rows = Array.from({ length: 6 });
  return (
    <>
      <div className="hidden md:block">
        <div className="rounded-md border border-dashed border-gray-200 bg-white">
          <div className="grid grid-cols-[2fr_1fr_auto_auto] items-center gap-4 border-b border-gray-100 px-4 py-3 text-xs uppercase text-gray-400">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-20 justify-self-end rounded-full" />
          </div>
          <div className="divide-y divide-gray-100">
            {rows.map((_, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[2fr_1fr_auto_auto] items-center gap-4 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-48 rounded-full" />
                  </div>
                </div>
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-6 w-6 justify-self-start rounded-full" />
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((_, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-dashed border-gray-200 bg-white p-4"
          >
            <div className="mb-3 flex items-start gap-3">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-16 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
