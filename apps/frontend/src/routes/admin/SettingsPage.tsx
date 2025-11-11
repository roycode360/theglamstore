import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import {
  CREATE_COUPON,
  DELETE_COUPON,
  LIST_COUPONS,
  SET_COUPON_ACTIVE,
  UPDATE_COUPON,
} from '../../graphql/coupons';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../components/ui/Toast';
import {
  GET_COMPANY_SETTINGS,
  UPSERT_COMPANY_SETTINGS,
} from '../../graphql/settings';
import { uploadToCloudinary } from '../../utils/cloudinary';

// Import sub-components
import { CompanySettingsSection } from '../../components/settings/CompanySettingsSection';
import { CouponsSection } from '../../components/settings/CouponsSection';
import { CouponFormModal } from '../../components/settings/CouponFormModal';
import DeliveryLocationsSection from '../../components/settings/DeliveryLocationsSection';

type CouponDiscount = 'PERCENTAGE' | 'FIXED';

type AdminCoupon = {
  _id: string;
  code: string;
  discountType: CouponDiscount;
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

type CouponFormState = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
  createdBy: string;
};

const initialFormState: CouponFormState = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
  isActive: true,
  createdBy: '',
};

type CompanySettingsFormState = {
  businessName: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  accountInstructions: string;
  promoEnabled: boolean;
  promoTitle: string;
  promoSubtitle: string;
  promoMessage: string;
  promoImageUrl: string;
  promoCtaLabel: string;
  promoCtaLink: string;
  promoDelaySeconds: string;
  founders: FounderForm[];
};

type CompanySettingsRecord = {
  _id: string;
  businessName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  accountInstructions?: string | null;
  promoEnabled?: boolean | null;
  promoTitle?: string | null;
  promoSubtitle?: string | null;
  promoMessage?: string | null;
  promoImageUrl?: string | null;
  promoCtaLabel?: string | null;
  promoCtaLink?: string | null;
  promoDelaySeconds?: number | null;
  founders?: FounderRecord[] | null;
  updatedAt?: string | null;
};

const initialCompanyForm: CompanySettingsFormState = {
  businessName: '',
  accountName: '',
  accountNumber: '',
  bankName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  accountInstructions: '',
  promoEnabled: false,
  promoTitle: '',
  promoSubtitle: '',
  promoMessage: '',
  promoImageUrl: '',
  promoCtaLabel: '',
  promoCtaLink: '',
  promoDelaySeconds: '',
  founders: [],
};

type FounderForm = {
  name: string;
  title: string;
  bio: string;
  imageUrl: string;
  order: number;
  visible: boolean;
};

type FounderRecord = {
  name: string;
  title?: string | null;
  bio?: string | null;
  imageUrl: string;
  order?: number | null;
  visible?: boolean | null;
};
function toDateTimeLocalValue(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function SettingsPage() {
  const { showToast } = useToast();
  const { data, loading, refetch } = useQuery<{ listCoupons: AdminCoupon[] }>(
    LIST_COUPONS,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  const {
    data: companyData,
    loading: companyLoading,
    refetch: refetchCompanySettings,
  } = useQuery<{ companySettings: CompanySettingsRecord | null }>(
    GET_COMPANY_SETTINGS,
    {
      fetchPolicy: 'cache-and-network',
    },
  );

  const [createCoupon] = useMutation(CREATE_COUPON);
  const [updateCoupon] = useMutation(UPDATE_COUPON);
  const [setCouponActive] = useMutation(SET_COUPON_ACTIVE);
  const [deleteCoupon] = useMutation(DELETE_COUPON);
  const [upsertCompanySettings] = useMutation(UPSERT_COMPANY_SETTINGS);

  const coupons = useMemo(() => data?.listCoupons ?? [], [data?.listCoupons]);
  const companySettings = companyData?.companySettings ?? null;

  const [form, setForm] = useState<CouponFormState>(initialFormState);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [companyForm, setCompanyForm] =
    useState<CompanySettingsFormState>(initialCompanyForm);
  const [companySaving, setCompanySaving] = useState(false);
  const [openCompanyBank, setOpenCompanyBank] = useState(false);
  const [openCompanyContact, setOpenCompanyContact] = useState(false);
  const [openCompanyInstructions, setOpenCompanyInstructions] = useState(false);
  const [openCoupons, setOpenCoupons] = useState(false);
  const [openPromo, setOpenPromo] = useState(false);
  const [openFounders, setOpenFounders] = useState(false);
  const [founderUploadingIndex, setFounderUploadingIndex] = useState<
    number | null
  >(null);
  const [openDeliveryLocations, setOpenDeliveryLocations] = useState(true);

  const promoPreview = useMemo(() => {
    const title = companyForm.promoTitle.trim();
    const subtitle = companyForm.promoSubtitle.trim();
    const message = companyForm.promoMessage.trim();
    const ctaLabel = companyForm.promoCtaLabel.trim();
    const hasLink = companyForm.promoCtaLink.trim().length > 0;

    return {
      title: title || 'Limited-time offer',
      subtitle,
      message:
        message ||
        'Spotlight a product launch, discount, or important announcement.',
      ctaLabel: ctaLabel || (hasLink ? 'Learn more' : ''),
      imageUrl: companyForm.promoImageUrl.trim(),
    };
  }, [companyForm]);

  useEffect(() => {
    if (companySettings) {
      setCompanyForm({
        businessName: companySettings.businessName ?? '',
        accountName: companySettings.accountName ?? '',
        accountNumber: companySettings.accountNumber ?? '',
        bankName: companySettings.bankName ?? '',
        contactEmail: companySettings.contactEmail ?? '',
        contactPhone: companySettings.contactPhone ?? '',
        address: companySettings.address ?? '',
        accountInstructions: companySettings.accountInstructions ?? '',
        promoEnabled: companySettings.promoEnabled ?? false,
        promoTitle: companySettings.promoTitle ?? '',
        promoSubtitle: companySettings.promoSubtitle ?? '',
        promoMessage: companySettings.promoMessage ?? '',
        promoImageUrl: companySettings.promoImageUrl ?? '',
        promoCtaLabel: companySettings.promoCtaLabel ?? '',
        promoCtaLink: companySettings.promoCtaLink ?? '',
        promoDelaySeconds:
          companySettings.promoDelaySeconds != null
            ? String(companySettings.promoDelaySeconds)
            : '',
        founders:
          (companySettings.founders ?? [])
            .map((f) => ({
              name: f.name,
              title: f.title ?? '',
              bio: f.bio ?? '',
              imageUrl: f.imageUrl,
              order: typeof f.order === 'number' ? f.order : 0,
              visible: f.visible ?? true,
            }))
            .sort((a, b) => a.order - b.order) ?? [],
      });
    } else {
      setCompanyForm({ ...initialCompanyForm });
    }
  }, [companySettings]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEditModal = (coupon: AdminCoupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType:
        coupon.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount
        ? coupon.minOrderAmount.toString()
        : '',
      maxDiscount: coupon.maxDiscount ? coupon.maxDiscount.toString() : '',
      usageLimit: coupon.usageLimit ? coupon.usageLimit.toString() : '',
      expiresAt: toDateTimeLocalValue(coupon.expiresAt),
      isActive: coupon.isActive,
      createdBy: coupon.createdBy ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
    setForm(initialFormState);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = form.code.trim().toUpperCase();
    const discountValueNumber = Number(form.discountValue);
    const minOrderAmountNumber = form.minOrderAmount
      ? Number(form.minOrderAmount)
      : undefined;
    const maxDiscountNumber = form.maxDiscount
      ? Number(form.maxDiscount)
      : undefined;
    const usageLimitNumber = form.usageLimit
      ? Number(form.usageLimit)
      : undefined;
    const expiresAtValue = form.expiresAt
      ? new Date(form.expiresAt).toISOString()
      : null;

    if (!code) {
      showToast('Coupon code is required.', 'error', {
        title: 'Missing code',
      });
      return;
    }

    if (!form.discountValue || Number.isNaN(discountValueNumber)) {
      showToast('Enter a valid discount value.', 'error', {
        title: 'Invalid discount',
      });
      return;
    }

    if (!expiresAtValue) {
      showToast('Please select an expiry date.', 'error', {
        title: 'Expiry required',
      });
      return;
    }

    setSaving(true);
    const payload = {
      code,
      discountType: form.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED',
      discountValue: discountValueNumber,
      minOrderAmount: minOrderAmountNumber,
      maxDiscount: maxDiscountNumber,
      usageLimit: usageLimitNumber,
      expiresAt: expiresAtValue,
      isActive: form.isActive,
      createdBy: form.createdBy.trim() || undefined,
    };

    try {
      if (editingCoupon) {
        await updateCoupon({
          variables: {
            id: editingCoupon._id,
            input: payload,
          },
        });
        showToast('Coupon updated successfully.', 'success', {
          title: editingCoupon.code,
        });
      } else {
        await createCoupon({
          variables: {
            input: payload,
          },
        });
        showToast('Coupon created successfully.', 'success', {
          title: code,
        });
      }
      await refetch();
      closeModal();
    } catch (error) {
      const message =
        (error as { message?: string })?.message ??
        'Unable to save coupon. Please try again.';
      showToast(message, 'error', { title: 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleCompanySubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedAccountName = companyForm.accountName.trim();
    const trimmedBankName = companyForm.bankName.trim();
    const cleanedAccountNumber = companyForm.accountNumber.replace(/\s+/g, '');
    const promoTitleTrimmed = companyForm.promoTitle.trim();
    const promoMessageTrimmed = companyForm.promoMessage.trim();
    const promoDelayInput = companyForm.promoDelaySeconds.trim();
    const promoCtaLinkTrimmed = companyForm.promoCtaLink.trim();
    const promoCtaLabelTrimmed = companyForm.promoCtaLabel.trim();

    if (!trimmedAccountName || !cleanedAccountNumber || !trimmedBankName) {
      showToast(
        'Account name, number, and bank name are required before saving.',
        'error',
        { title: 'Missing details' },
      );
      return;
    }

    let promoDelay: number | null = null;
    if (promoDelayInput.length > 0) {
      const parsed = Number(promoDelayInput);
      if (!Number.isFinite(parsed) || parsed < 0) {
        showToast(
          'Promo delay must be a positive number of seconds.',
          'error',
          { title: 'Invalid delay' },
        );
        return;
      }
      promoDelay = Math.round(parsed);
    }

    if (companyForm.promoEnabled) {
      if (!promoTitleTrimmed || !promoMessageTrimmed) {
        showToast(
          'Provide both a title and message when the promotional modal is enabled.',
          'error',
          { title: 'Incomplete promo content' },
        );
        return;
      }

      if (promoCtaLinkTrimmed && !promoCtaLabelTrimmed) {
        showToast('Add a button label for your promo link.', 'error', {
          title: 'Missing CTA label',
        });
        return;
      }
    }

    setCompanySaving(true);
    const sanitize = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    };

    const payload = {
      businessName: sanitize(companyForm.businessName),
      accountName: sanitize(companyForm.accountName),
      accountNumber: cleanedAccountNumber.length ? cleanedAccountNumber : null,
      bankName: sanitize(companyForm.bankName),
      contactEmail: sanitize(companyForm.contactEmail),
      contactPhone: sanitize(companyForm.contactPhone),
      address: sanitize(companyForm.address),
      accountInstructions: sanitize(companyForm.accountInstructions),
      promoEnabled: companyForm.promoEnabled,
      promoTitle: sanitize(companyForm.promoTitle),
      promoSubtitle: sanitize(companyForm.promoSubtitle),
      promoMessage: sanitize(companyForm.promoMessage),
      promoImageUrl: sanitize(companyForm.promoImageUrl),
      promoCtaLabel: sanitize(companyForm.promoCtaLabel),
      promoCtaLink: sanitize(companyForm.promoCtaLink),
      promoDelaySeconds: promoDelay,
      founders:
        companyForm.founders.length > 0
          ? companyForm.founders
              .map((f) => ({
                name: f.name.trim(),
                title: f.title.trim() || null,
                bio: f.bio.trim() || null,
                imageUrl: f.imageUrl.trim(),
                order:
                  typeof f.order === 'number' && !Number.isNaN(f.order)
                    ? f.order
                    : 0,
                visible: f.visible,
              }))
              .filter((f) => f.name && f.imageUrl)
          : null,
    };

    try {
      await upsertCompanySettings({
        variables: {
          input: payload,
        },
      });
      await refetchCompanySettings();
      showToast('Company details saved successfully.', 'success', {
        title: 'Company settings',
      });
    } catch (error) {
      const message =
        (error as { message?: string })?.message ??
        'Unable to save company details.';
      showToast(message, 'error', { title: 'Save failed' });
    } finally {
      setCompanySaving(false);
    }
  };

  const handleToggleActive = async (coupon: AdminCoupon) => {
    setToggleTarget(coupon._id);
    try {
      await setCouponActive({
        variables: {
          id: coupon._id,
          isActive: !coupon.isActive,
        },
      });
      await refetch();
      showToast(
        `Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}.`,
        'success',
        {
          title: coupon.code,
        },
      );
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Unable to update status.';
      showToast(message, 'error', { title: 'Update failed' });
    } finally {
      setToggleTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCoupon({
        variables: {
          id: deleteTarget._id,
        },
      });
      await refetch();
      showToast('Coupon removed.', 'success', { title: deleteTarget.code });
    } catch (error) {
      const message =
        (error as { message?: string })?.message ?? 'Unable to delete coupon.';
      showToast(message, 'error', { title: 'Delete failed' });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Founders helpers
  const addFounder = () => {
    setCompanyForm((prev) => ({
      ...prev,
      founders: [
        ...prev.founders,
        {
          name: '',
          title: '',
          bio: '',
          imageUrl: '',
          order: prev.founders.length,
          visible: true,
        },
      ],
    }));
  };

  const removeFounder = (index: number) => {
    setCompanyForm((prev) => {
      const next = [...prev.founders];
      next.splice(index, 1);
      return {
        ...prev,
        founders: next.map((f, i) => ({ ...f, order: i })),
      };
    });
  };

  const updateFounder = <K extends keyof FounderForm>(
    index: number,
    key: K,
    value: FounderForm[K],
  ) => {
    setCompanyForm((prev) => {
      const next = [...prev.founders];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, founders: next };
    });
  };

  const moveFounder = (index: number, direction: -1 | 1) => {
    setCompanyForm((prev) => {
      const next = [...prev.founders];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return {
        ...prev,
        founders: next.map((f, i) => ({ ...f, order: i })),
      };
    });
  };

  const handleFounderImageUpload = async (index: number, file: File) => {
    try {
      setFounderUploadingIndex(index);
      const { secure_url } = await uploadToCloudinary(file);
      updateFounder(index, 'imageUrl', secure_url);
      showToast('Image uploaded.', 'success', { title: 'Founder image' });
    } catch (e) {
      showToast('Upload failed. Please try again.', 'error', {
        title: 'Founder image',
      });
    } finally {
      setFounderUploadingIndex(null);
    }
  };
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-600">
          Configure store preferences, coupons, and other admin tools.
        </p>
      </div>
      {/* Delivery locations */}
      <DeliveryLocationsSection
        open={openDeliveryLocations}
        onToggle={() => setOpenDeliveryLocations((prev) => !prev)}
      />
      <CompanySettingsSection
        companySettings={companySettings}
        companyForm={companyForm}
        setCompanyForm={setCompanyForm}
        companySaving={companySaving}
        onSubmit={handleCompanySubmit}
        openCompanyBank={openCompanyBank}
        setOpenCompanyBank={setOpenCompanyBank}
        openCompanyContact={openCompanyContact}
        setOpenCompanyContact={setOpenCompanyContact}
        openCompanyInstructions={openCompanyInstructions}
        setOpenCompanyInstructions={setOpenCompanyInstructions}
        openPromo={openPromo}
        setOpenPromo={setOpenPromo}
        openFounders={openFounders}
        setOpenFounders={setOpenFounders}
        founderUploadingIndex={founderUploadingIndex}
        addFounder={addFounder}
        removeFounder={removeFounder}
        updateFounder={updateFounder}
        moveFounder={moveFounder}
        handleFounderImageUpload={handleFounderImageUpload}
      />

      <CouponsSection
        coupons={coupons}
        loading={loading}
        openCoupons={openCoupons}
        setOpenCoupons={setOpenCoupons}
        onCreateCoupon={openCreateModal}
        onEditCoupon={openEditModal}
        onToggleActive={handleToggleActive}
        onDeleteCoupon={(coupon) => setDeleteTarget(coupon)}
        toggleTarget={toggleTarget}
      />

      <CouponFormModal
        modalOpen={modalOpen}
        editingCoupon={editingCoupon}
        form={form}
        setForm={setForm}
        saving={saving}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete coupon?"
        message={
          <span>
            This will permanently remove{' '}
            <span className="font-semibold">{deleteTarget?.code}</span>.
            Existing orders using this coupon will not be affected.
          </span>
        }
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
