import { useEffect, useMemo, useState } from 'react';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import { generateSlug } from '../../utils/slug';
import { useToast } from '../../components/ui/Toast';
import { uploadToCloudinary } from '../../utils/cloudinary';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  sortOrder: number;
  parentId?: string | null;
  active: boolean;
};

export default function CategoryModal({
  open,
  onClose,
  onSave,
  categories,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (cat: Category) => Promise<void>;
  categories: Category[];
  initial?: Category | null;
}) {
  const isEdit = !!initial;
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [parentId, setParentId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);

  const parentOptions = useMemo(() => {
    const selectable = categories
      .filter((c) => c.id !== (initial?.id ?? ''))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ value: c.id, label: c.name }));
    return [{ value: '', label: 'None (Top Level)' }, ...selectable];
  }, [categories, initial?.id]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setSlug(initial.slug);
      setSortOrder(String(initial.sortOrder ?? 0));
      setParentId(initial.parentId ?? '');
      setDescription(initial.description ?? '');
      setImage(initial.image ?? '');
      setImageUrl('');
      setActive(!!initial.active);
    } else {
      setName('');
      setSlug('');
      setSortOrder('0');
      setParentId('');
      setDescription('');
      setImage('');
      setImageUrl('');
      setActive(true);
    }
  }, [open, initial]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const cat: Category = {
      id: initial?.id ?? Math.random().toString(36).slice(2),
      name,
      slug,
      description: description || undefined,
      image: image || undefined,
      sortOrder: Number(sortOrder || '0'),
      parentId: parentId || undefined,
      active,
    };
    try {
      setSaving(true);
      await onSave(cat);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to save category';
              showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="theme-border theme-card relative my-10 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg border p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-lg font-semibold">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </div>
          <button
            onClick={onClose}
            className="theme-border flex h-8 w-8 items-center justify-center rounded border"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <div className="font-medium">Category Name</div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full"
                required
              />
            </label>
            <label className="block text-sm">
              <div className="font-medium">URL Slug</div>
              <div className="mt-1 flex gap-2">
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full"
                  required
                />
                <button
                  type="button"
                  onClick={() => setSlug(generateSlug(name))}
                  className="theme-border shrink-0 rounded-md border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Generate
                </button>
              </div>
            </label>
            <label className="block text-sm">
              <div className="font-medium">Sort Order</div>
              <Input
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1 w-full"
              />
            </label>
            <label className="block text-sm">
              <div className="font-medium">Parent Category</div>
              <div className="mt-1">
                <Select
                  value={parentId}
                  onChange={setParentId}
                  options={parentOptions}
                />
              </div>
            </label>
          </div>

          <label className="block text-sm">
            <div className="font-medium">Description</div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full"
            />
          </label>

          <label className="block text-sm">
            <div className="font-medium">Image</div>
            <div className="mt-1 flex items-center gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
                placeholder="Image URL"
              />
              <button
                type="button"
                className="btn-primary rounded px-3 py-2"
                onClick={() => {
                  if (!imageUrl) return;
                  setImage(imageUrl);
                  setImageUrl('');
                }}
              >
                Add
              </button>
              <label className="btn-ghost cursor-pointer rounded px-3 py-2">
                {uploadingImg ? 'Uploading…' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingImg(true);
                      const { secure_url } = await uploadToCloudinary(file);
                      setImage(secure_url);
                      showToast('Image uploaded', 'success');
                    } catch (err) {
                                              showToast('Image upload failed', 'error');
                    } finally {
                      setUploadingImg(false);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </label>
            </div>
            {image && (
              <div className="mt-2">
                <div className="relative inline-block">
                  <img
                    src={image}
                    className="theme-border h-16 w-16 rounded border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-500 text-xs text-white"
                    aria-label="remove image"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </label>

          <div className="flex items-center gap-6">
            <Checkbox
              checked={active}
              onChange={setActive}
              label={<span className="text-sm">Active</span>}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost rounded px-4 py-2"
            >
              Cancel
            </button>
            <button className="btn-primary rounded px-4 py-2" disabled={saving}>
              {saving
                ? 'Saving...'
                : isEdit
                  ? 'Update Category'
                  : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
