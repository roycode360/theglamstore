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
    <div className="theme-card theme-border rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-brand font-semibold">Categories</span>
          <span className="border-brand text-brand bg-brand-50 rounded-full border px-2 py-0.5 text-xs">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories..."
            className="focus-brand h-9 w-64 text-sm"
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
      <div className="theme-border overflow-hidden rounded-md border">
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading categories" />
          </div>
        ) : (
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
                        >
                          {c.description}
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
