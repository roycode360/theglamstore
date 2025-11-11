import React from 'react';
import Modal from '../../../components/ui/Modal';
import { formatCurrency } from '../../../utils/currency';
import { useToast } from '../../../components/ui/Toast';

interface BankDetails {
  businessName: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  instructions?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface BankTransferModalProps {
  open: boolean;
  onClose: () => void;
  bankDetails: BankDetails;
  payableTotal: number;
  transferFile: File | null;
  onTransferFileChange: (file: File | null) => void;
  onPaymentSubmitted: (payload: {
    transferProofUrl?: string;
    whatsappClicked: boolean;
  }) => Promise<void>;
  submitting: boolean;
  setSubmitting: (value: boolean) => void;
  whatsappClicked: boolean;
  onWhatsappClick: () => void;
}

export default function BankTransferModal({
  open,
  onClose,
  bankDetails,
  payableTotal,
  transferFile,
  onTransferFileChange,
  onPaymentSubmitted,
  submitting,
  setSubmitting,
  whatsappClicked,
  onWhatsappClick,
}: BankTransferModalProps) {
  const { showToast } = useToast();
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      let proofUrl: string | undefined;
      if (transferFile) {
        const { secure_url } = await import('../../../utils/cloudinary').then(
          (mod) => mod.uploadToCloudinary(transferFile),
        );
        proofUrl = secure_url;
      }
      await onPaymentSubmitted({
        transferProofUrl: proofUrl,
        whatsappClicked,
      });
    } catch (error) {
      console.error(error);
      showToast('Failed to submit order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title="Bank Transfer Details"
      titleIcon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h18M5 6h14M7 14h10M9 18h6"
          />
        </svg>
      }
      widthClassName="max-w-xl"
      canDismiss={!submitting}
    >
      <div className="space-y-5">
        <div className="p-4 border rounded-lg theme-border">
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
            <BankDetailBadge
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m6-6H6"
                  />
                </svg>
              }
              label="Account Name"
              value={bankDetails.accountName}
              iconClasses="bg-emerald-50 text-emerald-600 ring-emerald-200"
            />
            <BankDetailBadge
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12a2 2 0 100 4h14a2 2 0 100-4"
                  />
                </svg>
              }
              label="Account Number"
              value={bankDetails.accountNumber}
            />
            <BankDetailBadge
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18M5 6h14M7 14h10M9 18h6"
                  />
                </svg>
              }
              label="Bank"
              value={bankDetails.bankName}
            />
          </div>
        </div>
        <div className="p-3 text-sm text-gray-800 rounded-lg bg-gray-50 ring-1 ring-gray-200">
          Please transfer{' '}
          <span className="font-semibold">{formatCurrency(payableTotal)}</span>{' '}
          to the account above.
          {bankDetails.instructions && <> {bankDetails.instructions}</>}
          <span className="block pt-2 text-xs text-gray-600">
            Please ensure to click the button below to complete the order.
          </span>
        </div>
        {(bankDetails.contactEmail || bankDetails.contactPhone) && (
          <div className="p-3 text-xs text-gray-600 bg-white border border-gray-200 border-dashed rounded-lg">
            {bankDetails.contactEmail && (
              <div>
                <span className="font-semibold text-gray-700">Email:</span>{' '}
                {bankDetails.contactEmail}
              </div>
            )}
            {bankDetails.contactPhone && (
              <div>
                <span className="font-semibold text-gray-700">Phone:</span>{' '}
                {bankDetails.contactPhone}
              </div>
            )}
          </div>
        )}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Upload transfer proof
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md cursor-pointer theme-border hover:bg-gray-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                />
              </svg>
              <span>Choose file</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) =>
                  onTransferFileChange(e.target.files?.[0] ?? null)
                }
              />
            </label>
            <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
              {transferFile ? transferFile.name : 'No file selected'}
            </div>
          </div>
        </div>

        <a
          href={`https://wa.me/${bankDetails.contactPhone}?text=${encodeURIComponent(
            `Hello, I just placed an order on TheGlamStore. Total: ${formatCurrency(
              payableTotal,
            )}. Attaching payment receipt now.`,
          )}`}
          target="_blank"
          rel="noreferrer"
          onClick={onWhatsappClick}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md theme-border hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            className="w-4 h-4"
            fill="#25D366"
          >
            <path d="M128 24a104 104 0 00-89.85 156.73L32 232l52.27-13.8A104 104 0 10128 24zm0 192a88 88 0 01-44.83-12.31l-3-.18-31.3 8.26 8.37-30.53-.2-3.12A88 88 0 11128 216zm50-66.31c-2.74-1.37-16.18-7.98-18.7-8.89s-4.33-1.37-6.12 1.37-7 8.89-8.59 10.73-3.16 2.06-5.9.69-11.5-4.24-21.94-13.5c-8.1-7.22-13.58-16.12-15.16-18.86s-.17-4.2 1.2-5.58c1.24-1.24 2.74-3.16 4.11-4.74a18.55 18.55 0 002.74-4.57 4.95 4.95 0 00-.23-4.57c-.69-1.37-6.12-14.72-8.4-20.17-2.21-5.3-4.46-4.58-6.12-4.66l-5.2-.09a10 10 0 00-7.27 3.39c-2.5 2.74-9.55 9.33-9.55 22.75s9.78 26.39 11.14 28.17 19.25 29.36 46.65 41.17A158.51 158.51 0 00164 170c6.86 0 12.32-2.17 16.9-6.85s7.85-10.51 8.88-14.63-.43-9.27-3.78-11.83z" />
          </svg>
          WhatsApp Payment Proof
        </a>

        <div className="flex justify-end gap-2 pt-2">
          <button
            className="px-3 rounded-md btn-ghost h-9 disabled:opacity-50"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 rounded-md btn-primary h-9 disabled:opacity-50"
            disabled={!(transferFile || whatsappClicked) || submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? (
              <>
                <span className="w-3 h-3 border-2 rounded-full border-brand animate-spin border-t-transparent" />
                <span>Submitting…</span>
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 12l5 5L20 7"
                  />
                </svg>
                <span>Complete Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function BankDetailBadge({
  icon,
  label,
  value,
  iconClasses = 'bg-gray-50 text-gray-600 ring-gray-200',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClasses?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md ring-1 ${iconClasses}`}
      >
        {icon}
      </span>
      <div>
        <div className="text-xs" style={{ color: 'rgb(var(--muted))' }}>
          {label}
        </div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
