import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { Header } from './Header';
import ScrollToTop from './ScrollToTop';
import { AuthLoadingModal } from '../ui/AuthLoadingModal';
import { useAuth } from '../../contexts/AuthContext';
import PromoModal from '../ui/PromoModal';
import { GET_COMPANY_SETTINGS } from '../../graphql/settings';
import AnalyticsRouterListener from '../analytics/AnalyticsRouterListener';

type PromoSettings = {
  _id: string;
  promoEnabled: boolean;
  promoTitle?: string | null;
  promoSubtitle?: string | null;
  promoMessage?: string | null;
  promoImageUrl?: string | null;
  promoCtaLabel?: string | null;
  promoCtaLink?: string | null;
  promoDelaySeconds?: number | null;
  updatedAt?: string | null;
};

export default function MainLayout() {
  const { loading, authStep, isLoginProcess } = useAuth();
  const { data } = useQuery<{ companySettings: PromoSettings | null }>(
    GET_COMPANY_SETTINGS,
    {
      fetchPolicy: 'cache-first',
    },
  );
  const promoSettings = data?.companySettings ?? null;

  const [promoKey, setPromoKey] = useState<string | null>(null);
  const [promoOpen, setPromoOpen] = useState(false);

  const promoContent = useMemo(() => {
    if (!promoSettings) {
      return null;
    }

    const title = promoSettings.promoTitle?.trim() ?? '';
    const subtitle = promoSettings.promoSubtitle?.trim() ?? '';
    const message = promoSettings.promoMessage?.trim() ?? '';
    const imageUrl = promoSettings.promoImageUrl?.trim() ?? '';
    const ctaLabel = promoSettings.promoCtaLabel?.trim() ?? '';
    const ctaLink = promoSettings.promoCtaLink?.trim() ?? '';

    if (!title && !message) {
      return null;
    }

    // Build a stable signature only from promo-related fields so saving unrelated settings
    // (or general updatedAt changes) does not force-show the promo again.
    const delaySeconds = Math.max(0, promoSettings.promoDelaySeconds ?? 0);
    const signature = JSON.stringify({
      title,
      subtitle,
      message,
      imageUrl,
      ctaLabel,
      ctaLink,
      delaySeconds,
    });

    return {
      title: title || 'Special announcement',
      subtitle,
      message:
        message ||
        'Share timely updates, exclusive offers, or important announcements with shoppers.',
      imageUrl,
      ctaLabel,
      ctaLink,
      delaySeconds,
      version: signature,
    };
  }, [promoSettings]);

  useEffect(() => {
    if (
      !promoSettings ||
      !promoSettings.promoEnabled ||
      !promoContent ||
      typeof window === 'undefined'
    ) {
      setPromoKey(null);
      setPromoOpen(false);
      return;
    }

    const storageKey = `promo-dismissed-${promoContent.version}`;
    setPromoKey(storageKey);

    if (window.localStorage.getItem(storageKey)) {
      setPromoOpen(false);
      return;
    }

    setPromoOpen(false);

    const timer = window.setTimeout(() => {
      setPromoOpen(true);
    }, promoContent.delaySeconds * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [promoSettings, promoContent]);

  const handleClosePromo = useCallback(() => {
    if (promoKey && typeof window !== 'undefined') {
      window.localStorage.setItem(promoKey, 'true');
    }
    setPromoOpen(false);
  }, [promoKey]);

  return (
    <div>
      <AnalyticsRouterListener />
      <ScrollToTop />
      <Header />
      <Outlet />
      <AuthLoadingModal isOpen={loading && isLoginProcess} step={authStep} />
      {promoContent && (
        <PromoModal
          open={promoOpen}
          onClose={handleClosePromo}
          content={promoContent}
        />
      )}
    </div>
  );
}
