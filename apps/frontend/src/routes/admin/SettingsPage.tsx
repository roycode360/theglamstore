import { useMutation, useQuery } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import {
  CREATE_COUPON,
  DELETE_COUPON,
  LIST_COUPONS,
  SET_COUPON_ACTIVE,
  UPDATE_COUPON,
} from '../../graphql/coupons';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Textarea from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  GET_COMPANY_SETTINGS,
  UPSERT_COMPANY_SETTINGS,
} from '../../graphql/settings';
import { uploadToCloudinary } from '../../utils/cloudinary';

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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
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

  const formatDiscountValue = (coupon: AdminCoupon) =>
    coupon.discountType === 'PERCENTAGE'
      ? `${coupon.discountValue}%`
      : formatCurrency(coupon.discountValue);

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

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Company account details
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Update your payout information and contact details used at
              checkout.
            </p>
          </div>
        </div>

        <div>
          {companyLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <form
              onSubmit={handleCompanySubmit}
              className="mt-6 space-y-6"
              id="company-settings-form"
            >
              {/* Business & payout details */}
              <div className="rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 p-3">
                  <div className="text-sm font-semibold text-neutral-900">
                    Business & payout details
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCompanyBank((v) => !v)}
                    aria-expanded={openCompanyBank}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`h-4 w-4 transition-transform ${openCompanyBank ? 'rotate-180' : ''}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  className={`grid gap-4 p-4 md:grid-cols-2 ${openCompanyBank ? '' : 'hidden'}`}
                >
                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Business name
                    <Input
                      value={companyForm.businessName}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          businessName: event.target.value,
                        }))
                      }
                      placeholder="TheGlamStore LTD"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Account name
                    <Input
                      value={companyForm.accountName}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          accountName: event.target.value,
                        }))
                      }
                      placeholder="TheGlamStore LTD"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Account number
                    <Input
                      value={companyForm.accountNumber}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          accountNumber: event.target.value,
                        }))
                      }
                      placeholder="0123456789"
                      inputMode="numeric"
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Bank name
                    <Input
                      value={companyForm.bankName}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          bankName: event.target.value,
                        }))
                      }
                      placeholder="Example Bank"
                      required
                    />
                  </label>
                </div>
              </div>

              {/* Contact & address */}
              <div className="rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 p-3">
                  <div className="text-sm font-semibold text-neutral-900">
                    Contact & address
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCompanyContact((v) => !v)}
                    aria-expanded={openCompanyContact}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`h-4 w-4 transition-transform ${openCompanyContact ? 'rotate-180' : ''}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  className={`grid gap-4 p-4 md:grid-cols-2 ${openCompanyContact ? '' : 'hidden'}`}
                >
                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Contact email
                    <Input
                      type="email"
                      value={companyForm.contactEmail}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          contactEmail: event.target.value,
                        }))
                      }
                      placeholder="support@theglamstore.ng"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Contact phone
                    <Input
                      type="tel"
                      value={companyForm.contactPhone}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          contactPhone: event.target.value,
                        }))
                      }
                      placeholder="+234 801 234 5678"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
                    Business address
                    <Textarea
                      rows={3}
                      value={companyForm.address}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                      placeholder="123 Fashion Avenue, Lagos, Nigeria"
                    />
                  </label>
                </div>
              </div>

              {/* Bank transfer instructions */}
              <div className="rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between border-b border-neutral-200 p-3">
                  <div className="text-sm font-semibold text-neutral-900">
                    Bank transfer instructions
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenCompanyInstructions((v) => !v)}
                    aria-expanded={openCompanyInstructions}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`h-4 w-4 transition-transform ${openCompanyInstructions ? 'rotate-180' : ''}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </button>
                </div>
                <div
                  className={`p-4 ${openCompanyInstructions ? '' : 'hidden'}`}
                >
                  <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                    Instructions
                    <Textarea
                      rows={3}
                      value={companyForm.accountInstructions}
                      onChange={(event) =>
                        setCompanyForm((prev) => ({
                          ...prev,
                          accountInstructions: event.target.value,
                        }))
                      }
                      placeholder="Please transfer the total to the account above and upload the receipt for confirmation."
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">
                      Promotional modal
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Configure the pop-up announcement customers see on the
                      storefront.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenPromo((v) => !v)}
                    aria-expanded={openPromo}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    title={openPromo ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`h-4 w-4 transition-transform ${openPromo ? 'rotate-180' : ''}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className={`${openPromo ? '' : 'hidden'} grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,320px)]`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Checkbox
                        checked={companyForm.promoEnabled}
                        onChange={(checked) =>
                          setCompanyForm((prev) => ({
                            ...prev,
                            promoEnabled: checked,
                          }))
                        }
                        label={
                          <span className="text-sm font-medium text-neutral-800">
                            {companyForm.promoEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        }
                      />
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                      Promo title
                      <Input
                        value={companyForm.promoTitle}
                        onChange={(event) =>
                          setCompanyForm((prev) => ({
                            ...prev,
                            promoTitle: event.target.value,
                          }))
                        }
                        placeholder="New collection just dropped ✨"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                      Subtitle (optional)
                      <Input
                        value={companyForm.promoSubtitle}
                        onChange={(event) =>
                          setCompanyForm((prev) => ({
                            ...prev,
                            promoSubtitle: event.target.value,
                          }))
                        }
                        placeholder="Available in limited quantities"
                      />
                    </label>

                    <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                      Message
                      <Textarea
                        rows={4}
                        value={companyForm.promoMessage}
                        onChange={(event) =>
                          setCompanyForm((prev) => ({
                            ...prev,
                            promoMessage: event.target.value,
                          }))
                        }
                        placeholder="Share more details about the promotion, featured products, or important announcements."
                      />
                    </label>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                        CTA label
                        <Input
                          value={companyForm.promoCtaLabel}
                          onChange={(event) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              promoCtaLabel: event.target.value,
                            }))
                          }
                          placeholder="Shop now"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                        CTA link
                        <Input
                          value={companyForm.promoCtaLink}
                          onChange={(event) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              promoCtaLink: event.target.value,
                            }))
                          }
                          placeholder="https://theglamstore.ng/collections/new-in"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
                        Image URL
                        <Input
                          value={companyForm.promoImageUrl}
                          onChange={(event) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              promoImageUrl: event.target.value,
                            }))
                          }
                          placeholder="https://res.cloudinary.com/your-image.jpg"
                        />
                      </label>

                      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                        Delay (seconds)
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={companyForm.promoDelaySeconds}
                          onChange={(event) =>
                            setCompanyForm((prev) => ({
                              ...prev,
                              promoDelaySeconds: event.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                        <span className="text-xs font-normal text-neutral-500">
                          How long to wait after page load before showing the
                          modal.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-brand text-xs font-semibold uppercase tracking-wide">
                        Preview
                      </span>
                      <span
                        className={`text-xs font-medium ${companyForm.promoEnabled ? 'text-emerald-600' : 'text-neutral-400'}`}
                      >
                        {companyForm.promoEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {promoPreview.imageUrl ? (
                        <div className="overflow-hidden rounded-xl border border-neutral-200">
                          <img
                            src={promoPreview.imageUrl}
                            alt="Promo visual"
                            className="h-40 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500">
                          Promo image preview
                        </div>
                      )}
                      <div className="space-y-1">
                        <h4 className="text-lg font-semibold text-neutral-900">
                          {promoPreview.title}
                        </h4>
                        {promoPreview.subtitle ? (
                          <p className="text-brand text-sm font-medium">
                            {promoPreview.subtitle}
                          </p>
                        ) : null}
                        <p className="text-sm text-neutral-600">
                          {promoPreview.message}
                        </p>
                      </div>
                      {promoPreview.ctaLabel ? (
                        <button
                          type="button"
                          className="bg-brand inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm"
                        >
                          {promoPreview.ctaLabel}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <section className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-neutral-900">
                      Founders
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      Manage the founders shown on the site. Reorder, toggle
                      visibility, and update content.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenFounders((v) => !v)}
                    aria-expanded={openFounders}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    title={openFounders ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className={`h-4 w-4 transition-transform ${openFounders ? 'rotate-180' : ''}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </button>
                </div>

                <div className={openFounders ? '' : 'hidden'}>
                  <div className="mb-3 mt-3 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={addFounder}
                      className="bg-brand inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-semibold text-white shadow-sm"
                    >
                      Add founder
                    </button>
                  </div>
                  {companyForm.founders.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-sm text-neutral-600">
                      No founders yet. Click “Add founder” to create one.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {companyForm.founders.map((f, index) => (
                        <div
                          key={`founder-${index}`}
                          className="rounded-xl border border-neutral-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                                {f.imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={f.imageUrl}
                                    alt={f.name || 'Founder image'}
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveFounder(index, -1)}
                                  className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
                                  disabled={index === 0}
                                >
                                  Up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveFounder(index, 1)}
                                  className="rounded-md border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
                                  disabled={
                                    index === companyForm.founders.length - 1
                                  }
                                >
                                  Down
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={f.visible}
                                onChange={(checked) =>
                                  updateFounder(index, 'visible', checked)
                                }
                                label={
                                  <span className="text-sm font-medium text-neutral-800">
                                    {f.visible ? 'Visible' : 'Hidden'}
                                  </span>
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeFounder(index)}
                                className="text-sm font-semibold text-rose-600"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                              Name
                              <Input
                                value={f.name}
                                onChange={(e) =>
                                  updateFounder(index, 'name', e.target.value)
                                }
                                placeholder="Founder name"
                                required
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
                              Title (optional)
                              <Input
                                value={f.title}
                                onChange={(e) =>
                                  updateFounder(index, 'title', e.target.value)
                                }
                                placeholder="CEO, Co‑founder"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
                              Bio
                              <Textarea
                                rows={3}
                                value={f.bio}
                                onChange={(e) =>
                                  updateFounder(index, 'bio', e.target.value)
                                }
                                placeholder="Short writeup to display on site."
                              />
                            </label>
                            <div className="flex flex-col gap-2 md:col-span-2">
                              <div className="flex items-center gap-3">
                                <label className="theme-border inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                                  {founderUploadingIndex === index ? (
                                    <>
                                      <svg
                                        className="h-4 w-4 animate-spin text-neutral-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        />
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        />
                                      </svg>
                                      <span>Uploading…</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        className="h-4 w-4"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                                        />
                                      </svg>
                                      <span>Upload image</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        await handleFounderImageUpload(
                                          index,
                                          file,
                                        );
                                    }}
                                    disabled={founderUploadingIndex === index}
                                  />
                                </label>
                                <Input
                                  value={f.imageUrl}
                                  onChange={(e) =>
                                    updateFounder(
                                      index,
                                      'imageUrl',
                                      e.target.value,
                                    )
                                  }
                                  placeholder="https://res.cloudinary.com/…"
                                  className="flex-1"
                                  disabled={founderUploadingIndex === index}
                                />
                              </div>
                              <div className="text-xs text-neutral-500">
                                Recommended: square image, at least 400×400px.
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4 md:flex-row md:items-center md:justify-between">
                {companySettings?.updatedAt && (
                  <p className="text-xs text-neutral-500">
                    Last updated {formatDate(companySettings.updatedAt)}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="btn-primary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={companySaving}
                  >
                    {companySaving ? 'Saving...' : 'Save details'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Coupons</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Create and manage promotional codes for your customers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="btn-primary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold"
            >
              Create coupon
            </button>
            <button
              type="button"
              onClick={() => setOpenCoupons((v) => !v)}
              aria-expanded={openCoupons}
              className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 px-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              title={openCoupons ? 'Collapse' : 'Expand'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={`h-4 w-4 transition-transform ${openCoupons ? 'rotate-180' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 9l6 6 6-6"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className={openCoupons ? '' : 'hidden'}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7h8M8 12h5M12 17h8"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5a2 2 0 0 1 2-2h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"
                  />
                </svg>
              </span>
              <div className="text-base font-semibold text-neutral-800">
                No coupons yet
              </div>
              <p className="max-w-sm text-sm text-neutral-600">
                Create a coupon to reward loyal customers or run limited-time
                promotions.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Code
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Type
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Value
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Min spend
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Max discount
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Usage
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {coupons.map((coupon) => (
                      <tr key={coupon._id} className="bg-white">
                        <td className="whitespace-nowrap px-4 py-3 font-semibold uppercase tracking-wide text-neutral-900">
                          {coupon.code}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 capitalize text-neutral-700">
                          {coupon.discountType}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                          {formatDiscountValue(coupon)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                          {coupon.minOrderAmount != null
                            ? formatCurrency(coupon.minOrderAmount)
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                          {coupon.maxDiscount != null
                            ? formatCurrency(coupon.maxDiscount)
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                          {coupon.usageLimit
                            ? `${coupon.usedCount}/${coupon.usageLimit}`
                            : `${coupon.usedCount}`}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge active={coupon.isActive} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                          {formatDate(coupon.expiresAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(coupon)}
                              className="text-sm font-semibold text-neutral-700 transition hover:text-neutral-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(coupon)}
                              className="text-sm font-semibold text-neutral-700 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={toggleTarget === coupon._id}
                            >
                              {coupon.isActive ? 'Disable' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(coupon)}
                              className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 md:hidden">
                {coupons.map((coupon) => (
                  <div
                    key={`${coupon._id}-mobile`}
                    className="rounded-xl border border-neutral-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-wide text-neutral-900">
                          {coupon.code}
                        </div>
                        <div className="mt-1 text-xs text-neutral-600">
                          Expires {formatDate(coupon.expiresAt)}
                        </div>
                      </div>
                      <StatusBadge active={coupon.isActive} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-neutral-600">
                      <div className="space-y-1">
                        <span className="block font-semibold text-neutral-800">
                          Type
                        </span>
                        <span className="capitalize">
                          {coupon.discountType}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="block font-semibold text-neutral-800">
                          Value
                        </span>
                        <span>{formatDiscountValue(coupon)}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="block font-semibold text-neutral-800">
                          Min spend
                        </span>
                        <span>
                          {coupon.minOrderAmount != null
                            ? formatCurrency(coupon.minOrderAmount)
                            : '—'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="block font-semibold text-neutral-800">
                          Usage
                        </span>
                        <span>
                          {coupon.usageLimit
                            ? `${coupon.usedCount}/${coupon.usageLimit}`
                            : `${coupon.usedCount}`}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-end gap-3 text-sm">
                      <button
                        type="button"
                        onClick={() => openEditModal(coupon)}
                        className="font-semibold text-neutral-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(coupon)}
                        className="font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={toggleTarget === coupon._id}
                      >
                        {coupon.isActive ? 'Disable' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(coupon)}
                        className="font-semibold text-rose-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCoupon ? 'Edit coupon' : 'Create coupon'}
        widthClassName="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="btn-ghost h-10 rounded-md px-4 text-sm font-semibold"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="coupon-form"
              className="btn-primary h-10 rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : editingCoupon
                  ? 'Save changes'
                  : 'Create coupon'}
            </button>
          </>
        }
      >
        <form id="coupon-form" className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Coupon code
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="GLAMBABE10"
                className="uppercase tracking-wide"
                autoFocus
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Discount type
              <Select
                value={form.discountType}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    discountType: value as 'percentage' | 'fixed',
                  }))
                }
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed amount' },
                ]}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Discount value
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    discountValue: event.target.value,
                  }))
                }
                placeholder={form.discountType === 'percentage' ? '10' : '5000'}
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Minimum order amount
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    minOrderAmount: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Maximum discount
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.maxDiscount}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    maxDiscount: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800">
              Usage limit
              <Input
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    usageLimit: event.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
              Expires at
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    expiresAt: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
              Created by
              <Input
                value={form.createdBy}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    createdBy: event.target.value,
                  }))
                }
                placeholder="Optional admin name"
              />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-neutral-800">
                Active status
              </div>
              <p className="text-xs text-neutral-600">
                Active coupons can be applied at checkout immediately.
              </p>
            </div>
            <Checkbox
              checked={form.isActive}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: checked,
                }))
              }
              label={
                <span className="text-sm font-medium text-neutral-800">
                  {form.isActive ? 'Active' : 'Inactive'}
                </span>
              }
            />
          </div>
        </form>
      </Modal>

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
