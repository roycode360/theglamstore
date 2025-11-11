import { useState } from 'react';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/date';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';

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

type CompanySettingsSectionProps = {
  companySettings: CompanySettingsRecord | null;
  companyForm: CompanySettingsFormState;
  setCompanyForm: React.Dispatch<React.SetStateAction<CompanySettingsFormState>>;
  companySaving: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  openCompanyBank: boolean;
  setOpenCompanyBank: (open: boolean) => void;
  openCompanyContact: boolean;
  setOpenCompanyContact: (open: boolean) => void;
  openCompanyInstructions: boolean;
  setOpenCompanyInstructions: (open: boolean) => void;
  openPromo: boolean;
  setOpenPromo: (open: boolean) => void;
  openFounders: boolean;
  setOpenFounders: (open: boolean) => void;
  founderUploadingIndex: number | null;
  addFounder: () => void;
  removeFounder: (index: number) => void;
  updateFounder: <K extends keyof FounderForm>(
    index: number,
    key: K,
    value: FounderForm[K],
  ) => void;
  moveFounder: (index: number, direction: -1 | 1) => void;
  handleFounderImageUpload: (index: number, file: File) => Promise<void>;
};

export function CompanySettingsSection({
  companySettings,
  companyForm,
  setCompanyForm,
  companySaving,
  onSubmit,
  openCompanyBank,
  setOpenCompanyBank,
  openCompanyContact,
  setOpenCompanyContact,
  openCompanyInstructions,
  setOpenCompanyInstructions,
  openPromo,
  setOpenPromo,
  openFounders,
  setOpenFounders,
  founderUploadingIndex,
  addFounder,
  removeFounder,
  updateFounder,
  moveFounder,
  handleFounderImageUpload,
}: CompanySettingsSectionProps) {
  const promoPreview = {
    title: companyForm.promoTitle.trim() || 'Limited-time offer',
    subtitle: companyForm.promoSubtitle.trim(),
    message:
      companyForm.promoMessage.trim() ||
      'Spotlight a product launch, discount, or important announcement.',
    ctaLabel: companyForm.promoCtaLabel.trim() || (companyForm.promoCtaLink.trim() ? 'Learn more' : ''),
    imageUrl: companyForm.promoImageUrl.trim(),
  };

  return (
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

      <form
        onSubmit={onSubmit}
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
              onClick={() => setOpenCompanyBank(!openCompanyBank)}
              aria-expanded={!!openCompanyBank}
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
              onClick={() => setOpenCompanyContact(!openCompanyContact)}
              aria-expanded={!!openCompanyContact}
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
              onClick={() => setOpenCompanyInstructions(!openCompanyInstructions)}
              aria-expanded={!!openCompanyInstructions}
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

        {/* Promotional modal */}
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
              onClick={() => setOpenPromo(!openPromo)}
              aria-expanded={!!openPromo}
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
                <input
                  type="checkbox"
                  checked={companyForm.promoEnabled}
                  onChange={(e) =>
                    setCompanyForm((prev) => ({
                      ...prev,
                      promoEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm font-medium text-neutral-800">
                  {companyForm.promoEnabled ? 'Enabled' : 'Disabled'}
                </label>
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

        {/* Founders */}
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
              onClick={() => setOpenFounders(!openFounders)}
              aria-expanded={!!openFounders}
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
                No founders yet. Click "Add founder" to create one.
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
                        <input
                          type="checkbox"
                          checked={f.visible}
                          onChange={(e) =>
                            updateFounder(index, 'visible', e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm font-medium text-neutral-800">
                          {f.visible ? 'Visible' : 'Hidden'}
                        </label>
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
    </section>
  );
}
