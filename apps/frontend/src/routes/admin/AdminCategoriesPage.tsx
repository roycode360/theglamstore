import { gql, useMutation, useQuery } from '@apollo/client';
import { useMemo, useState } from 'react';
import Input from '../../components/ui/Input';
import CategoryModal, { type Category } from './CategoryModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';

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
              parentId: cat.parentId,
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
              parentId: cat.parentId,
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

  return (
    <div className="px-2 py-6 border rounded-lg theme-card theme-border">
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand">Categories</span>
          <span className="border-brand text-brand bg-brand-50 rounded-full border px-2 py-0.5 text-xs">
            {filtered.length}
          </span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories..."
            className="w-full text-sm focus-brand h-9 sm:w-64"
          />
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="px-3 text-sm rounded-md btn-primary h-9"
          >
            + Add Category
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-md">
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading categories" />
          </div>
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
                <tbody className="divide-y theme-border">
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden bg-gray-100 border rounded theme-border">
                            {c.image && (
                              <img
                                src={c.image}
                                className="object-cover w-full h-full"
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
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs border rounded-full theme-border">
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
                            className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
                            aria-label="edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setToDelete(c._id)}
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
                  className="py-10 text-sm text-center"
                  style={{ color: 'rgb(var(--muted))' }}
                >
                  No categories found
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((c) => (
                    <div
                      key={c._id}
                      className="p-4 border rounded-lg theme-border"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-16 h-16 overflow-hidden bg-gray-100 border rounded theme-border">
                          {c.image && (
                            <img
                              src={c.image}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
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
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs border rounded-full theme-border">
                            {c.sortOrder}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditing(c);
                              setModalOpen(true);
                            }}
                            className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
                            aria-label="edit"
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setToDelete(c._id)}
                            className="flex items-center justify-center w-8 h-8 bg-white border rounded theme-border hover:bg-brand-50 text-brand"
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
