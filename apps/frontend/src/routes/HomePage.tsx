import { useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import { LIST_FEATURED } from '../graphql/products';
import { LIST_CATEGORIES } from '../graphql/categories';
import { GET_COMPANY_SETTINGS } from '../graphql/settings';

// Import homepage components
import { HeroSection } from '../components/home/HeroSection';
import { BenefitsBar } from '../components/home/BenefitsBar';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { QuoteSection } from '../components/home/QuoteSection';
import { CategoriesSection } from '../components/home/CategoriesSection';
import { FoundersSection } from '../components/home/FoundersSection';

export default function HomePage() {
  const { data: featData, loading: loadingP } = useQuery(LIST_FEATURED);
  const { data: catsData, loading: loadingC } = useQuery(LIST_CATEGORIES);
  const { data: settingsData, loading: loadingSettings } =
    useQuery(GET_COMPANY_SETTINGS);
  const products = featData?.listFeaturedProducts ?? [];
  const categories = (catsData?.listCategories ?? []).slice(0, 8);
  const founders = useMemo(() => {
    const raws = settingsData?.companySettings?.founders ?? [];
    return raws
      .filter((f: any) => f && (f.visible ?? true))
      .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)) as Array<{
      name: string;
      title?: string | null;
      bio?: string | null;
      imageUrl: string;
      order?: number | null;
      visible?: boolean | null;
    }>;
  }, [settingsData?.companySettings?.founders]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      // Animation reveal logic handled by individual components
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <HeroSection />

      <BenefitsBar />

      <FeaturedProductsSection products={products} loading={loadingP} />

      <QuoteSection />

      <CategoriesSection categories={categories} loading={loadingC} />

      <FoundersSection founders={founders} loading={loadingSettings} />
    </>
  );
}
