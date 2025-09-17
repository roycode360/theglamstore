/*
  Seed 50 products with previewable images.
  Usage: MONGODB_URI=... yarn workspace backend run seed:products
*/
import 'dotenv/config';
import mongoose from 'mongoose';
import {
  ProductSchema,
  ProductModel as ProductModelClass,
} from '../products/schemas/product.schema';
import {
  CategorySchema,
  CategoryModel as CategoryModelClass,
} from '../categories/schemas/category.schema';

type AnyDoc = Record<string, unknown> & { _id?: unknown };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSizesForCategory(cat: string): string[] {
  if (/shoe|sneaker|boot/i.test(cat))
    return ['39', '40', '41', '42', '43', '44'];
  if (/bag|watch|accessory/i.test(cat)) return [];
  return ['XS', 'S', 'M', 'L', 'XL'];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  const Product = mongoose.model(ProductModelClass.name, ProductSchema);
  const Category = mongoose.model(CategoryModelClass.name, CategorySchema);

  const categoryDocs: AnyDoc[] = await Category.find().lean();
  const categoryNames = categoryDocs
    ?.map((c) => String(c.name))
    .filter(Boolean);

  const fallbackCategories = [
    'Dresses',
    'Tops',
    'Outerwear',
    'Shoes',
    'Bags',
    'Accessories',
    'Beauty',
    'Jewelry',
  ];

  const categories =
    categoryNames && categoryNames.length > 0
      ? categoryNames
      : fallbackCategories;

  const brands = [
    'Aurora',
    'LuxeCo',
    'Velvet & Co',
    'Opaline',
    'Glamora',
    'Noir',
    'Ivory Lane',
  ];

  const products: AnyDoc[] = [];
  const total = 50;
  for (let i = 0; i < total; i += 1) {
    const category = pick(categories);
    const baseName = `${pick(['Classic', 'Modern', 'Premium', 'Tailored', 'Elevated', 'Signature'])} ${category}`;
    const name = `${baseName} ${i + 1}`;
    const unique = Math.random().toString(36).slice(2, 6);
    const slug = `${slugify(name)}-${unique}`;
    const brand = pick(brands);
    const price = Math.floor(40 + Math.random() * 260);
    const sale =
      Math.random() < 0.4
        ? Math.floor(price * (0.7 + Math.random() * 0.2))
        : null;

    const seed = slug.replace(/[^a-z0-9]/g, '');
    const images = [
      `https://picsum.photos/seed/${seed}a/800/800`,
      `https://picsum.photos/seed/${seed}b/800/800`,
    ];

    const sizes = getSizesForCategory(category);
    const colors = ['Black', 'White', 'Beige', 'Red', 'Navy', 'Olive', 'Brown'];

    products.push({
      name,
      slug,
      brand,
      category,
      price,
      salePrice: sale,
      sku: `SKU-${unique.toUpperCase()}-${i + 1}`,
      stockQuantity: Math.floor(5 + Math.random() * 40),
      description:
        'A thoughtfully crafted piece with premium materials and refined details for everyday elegance.',
      images,
      sizes,
      colors,
      featured: Math.random() < 0.15,
      active: true,
    });
  }

  // Insert, ignoring duplicates by slug if script runs twice
  const inserted = await Product.insertMany(products, { ordered: false }).catch(
    (err: any) => {
      if (err?.writeErrors) {
        const successCount = products.length - err.writeErrors.length;
        return { length: successCount };
      }
      throw err;
    },
  );

  const count = Array.isArray(inserted)
    ? inserted.length
    : (inserted.length ?? 0);
  // eslint-disable-next-line no-console
  console.log(`Seeded ${count} products.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
