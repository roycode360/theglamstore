import { gql, useMutation, useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import { generateBaseSKU } from '../../utils/sku';
import { generateSlug } from '../../utils/slug';
import { uploadToCloudinary } from '../../utils/cloudinary';
import Checkbox from '../../components/ui/Checkbox';
import { useToast } from '../../components/ui/Toast';

const CREATE_PRODUCT = gql`
  mutation Create($input: CreateProductInput!) {
    createProduct(input: $input) {
      _id
    }
  }
`;
const UPDATE_PRODUCT = gql`
  mutation Update($id: ID!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      _id
    }
  }
`;
const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      _id
      name
      slug
      brand
      category
      price
      salePrice
      sku
      stockQuantity
      description
      images
      sizes
      colors
      featured
      active
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    listCategories {
      _id
      name
      slug
    }
  }
`;

type Product = any;

export default function ProductModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Product | null;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [create] = useMutation(CREATE_PRODUCT);
  const [update] = useMutation(UPDATE_PRODUCT);
  const { showToast } = useToast();
  const { data: catsData } = useQuery(LIST_CATEGORIES);
  const { data: fullData, loading: productLoading } = useQuery(GET_PRODUCT, {
    variables: { id: initial?._id },
    skip: !(open && isEdit && initial?._id),
    fetchPolicy: 'cache-first',
  });

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [sku, setSku] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [catHighlight, setCatHighlight] = useState(0);
  const catBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const src = (fullData?.getProduct ?? initial) as any;
    if (!src) {
      // New product: hard reset all fields
      setName('');
      setSlug('');
      setBrand('');
      setCategory('');
      setPrice('');
      setSalePrice('');
      setSku('');
      setStockQuantity('');
      setDescription('');
      setImages([]);
      setSizes([]);
      setColors([]);
      setFeatured(false);
      setActive(true);
      setImageUrl('');
      setSizeInput('');
      setColorInput('');
      return;
    }
    setName(src.name || '');
    setSlug(src.slug || '');
    setBrand(src.brand || '');
    setCategory(src.category || '');
    setPrice(src.price != null ? String(src.price) : '');
    setSalePrice(src.salePrice != null ? String(src.salePrice) : '');
    setSku(src.sku || '');
    setStockQuantity(
      src.stockQuantity != null ? String(src.stockQuantity) : '',
    );
    setDescription(src.description || '');
    setImages(src.images || []);
    setSizes(src.sizes || []);
    setColors(src.colors || []);
    setFeatured(!!src.featured);
    setActive(src.active ?? true);
    setImageUrl('');
    setSizeInput('');
    setColorInput('');
  }, [open, initial, fullData]);

  const categoryOptions = (catsData?.listCategories ?? []).map((c: any) => ({
    value: c.slug,
    label: c.name,
  }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: any = {
      name,
      slug,
      brand: brand || null,
      category,
      price: Number(price || '0'),
      salePrice: salePrice ? Number(salePrice) : null,
      sku: sku || null,
      stockQuantity: stockQuantity ? Number(stockQuantity) : null,
      description: description || null,
      images,
      sizes,
      colors,
      featured,
      active,
    };
    try {
      if (isEdit) {
        await update({ variables: { id: initial._id, input } });
        showToast('Product updated', 'success');
      } else {
        await create({ variables: { input } });
        showToast('Product created', 'success');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      const message = err?.message || 'Failed to save product';
      showToast(message, 'error');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="theme-border theme-card relative mx-2 my-10 max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg border p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 border rounded theme-border"
            aria-label="close"
          >
            ×
          </button>
        </div>
        {isEdit && initial?._id && productLoading && !fullData?.getProduct && (
          <div
            className="flex items-center gap-2 mb-3 text-sm"
            style={{ color: 'rgb(var(--muted))' }}
          >
            <span className="w-3 h-3 border-2 rounded-full border-brand animate-spin border-t-transparent" />
            <span>Prefilling product details…</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <fieldset
            disabled={
              isEdit && initial?._id && productLoading && !fullData?.getProduct
            }
            className="space-y-5"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <div className="font-medium">Product Name</div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1"
                  required
                />
              </label>
              <label className="block text-sm">
                <div className="font-medium">Category</div>
                <div className="mt-1" ref={catBoxRef}>
                  <Select
                    value={category}
                    onChange={setCategory}
                    options={[
                      { value: '', label: 'Select category' },
                      ...categoryOptions,
                    ]}
                  />
                </div>
              </label>
              <label className="block text-sm">
                <div className="font-medium">URL Slug</div>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSlug(generateSlug(name))}
                    className="px-3 py-2 text-sm bg-white border rounded-md theme-border shrink-0 hover:bg-gray-50"
                  >
                    Generate
                  </button>
                </div>
              </label>
              <label className="block text-sm">
                <div className="font-medium">SKU</div>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSku(
                        generateBaseSKU(category, name, {
                          maxSegmentLength: 8,
                        }),
                      )
                    }
                    className="px-3 py-2 text-sm bg-white border rounded-md theme-border shrink-0 hover:bg-gray-50"
                  >
                    Generate
                  </button>
                </div>
              </label>
              <label className="block text-sm">
                <div className="font-medium">Brand</div>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full mt-1"
                />
              </label>
              <label className="block text-sm">
                <div className="font-medium">Stock Quantity</div>
                <Input
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full mt-1"
                />
              </label>
              <label className="block text-sm">
                <div className="font-medium">Price (₦)</div>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full mt-1"
                  required
                />
              </label>
              <label className="block text-sm">
                <div className="font-medium">Sale Price (₦)</div>
                <Input
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full mt-1"
                />
              </label>
            </div>

            <label className="block text-sm">
              <div className="font-medium">Description</div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full mt-1"
              />
            </label>

            <div className="space-y-4">
              <div>
                <div className="mb-1 text-sm font-medium">Product Images</div>
                <div className="flex items-center gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1"
                    placeholder="Image URL"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl) {
                        setImages([...images, imageUrl]);
                        setImageUrl('');
                      }
                    }}
                    className="px-3 py-2 rounded btn-primary"
                  >
                    Add
                  </button>
                  <label className="px-3 py-2 rounded cursor-pointer btn-ghost">
                    {uploading ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (!files.length) return;
                        try {
                          setUploading(true);
                          const urls: string[] = [];
                          for (const file of files) {
                            try {
                              const { secure_url } =
                                await uploadToCloudinary(file);
                              urls.push(secure_url);
                            } catch (err) {
                              console.error(err);
                              showToast(`Failed: ${file.name}`, 'error');
                            }
                          }
                          if (urls.length) {
                            setImages((prev) => [...prev, ...urls]);
                            showToast(
                              `Uploaded ${urls.length} image(s)`,
                              'success',
                            );
                          }
                        } finally {
                          setUploading(false);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((src, i) => (
                    <div
                      key={i}
                      className="relative thumb"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', String(i));
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = Number(
                          e.dataTransfer.getData('text/plain'),
                        );
                        if (isNaN(from)) return;
                        if (from === i) return;
                        setImages((prev) => {
                          const next = [...prev];
                          const [moved] = next.splice(from, 1);
                          next.splice(i, 0, moved);
                          return next;
                        });
                      }}
                    >
                      <img
                        src={src}
                        className="object-cover w-16 h-16 border rounded theme-border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages(images.filter((_, idx) => idx !== i))
                        }
                        className="absolute w-6 h-6 text-xs text-white bg-red-500 rounded-full -right-2 -top-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">Available Sizes</div>
                <div className="flex items-center gap-2">
                  <Input
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    className="flex-1"
                    placeholder="Size (e.g., 7, S, M)"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (sizeInput) {
                        setSizes([...sizes, sizeInput]);
                        setSizeInput('');
                      }
                    }}
                    className="px-3 py-2 rounded btn-primary"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sizes.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 text-sm font-semibold border rounded-full theme-border"
                    >
                      {s}{' '}
                      <button
                        type="button"
                        className="ml-1"
                        onClick={() =>
                          setSizes(sizes.filter((_, idx) => idx !== i))
                        }
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1 text-sm font-medium">Available Colors</div>
                <div className="flex items-center gap-2">
                  <Input
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    className="flex-1"
                    placeholder="Color name"
                  />
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-12 h-10 border rounded theme-border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const label = (colorInput || colorHex).trim();
                      if (!label) return;
                      const value = `${label}|${colorHex}`;
                      setColors([...colors, value]);
                      setColorInput('');
                    }}
                    className="px-3 py-2 rounded btn-primary"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((c, i) => {
                    const [label, hex] = c.includes('|')
                      ? (c.split('|') as [string, string])
                      : [c, '#000000'];
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 px-2 text-sm border rounded-full theme-border"
                      >
                        <span
                          className="inline-block w-3 h-3 border rounded-full"
                          style={{ backgroundColor: hex }}
                        />{' '}
                        {label}
                        <button
                          type="button"
                          className="ml-1"
                          onClick={() =>
                            setColors(colors.filter((_, idx) => idx !== i))
                          }
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Checkbox
                checked={featured}
                onChange={setFeatured}
                label={<span className="text-sm">Featured Product</span>}
              />
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
                className="px-4 py-2 rounded btn-ghost"
              >
                Cancel
              </button>
              <button className="px-4 py-2 rounded btn-primary">
                {isEdit ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
