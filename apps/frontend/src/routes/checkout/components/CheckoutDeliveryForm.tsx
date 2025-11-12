import React from 'react';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
}

interface CheckoutDeliveryFormProps {
  values: CheckoutFormValues;
  onChange: <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K],
  ) => void;
  onContinue: () => void;
  canContinue: boolean;
}

export default function CheckoutDeliveryForm({
  values,
  onChange,
  onContinue,
  canContinue,
}: CheckoutDeliveryFormProps) {
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">Delivery Information</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block mb-1 text-sm font-medium">First Name *</label>
          <input
            className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Last Name *</label>
          <input
            className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Email *</label>
          <input
            type="email"
            className="w-full px-3 py-2 text-gray-600 border rounded-md theme-border bg-gray-50 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.email}
            readOnly
            required
          />
          <p className="mt-1 text-xs text-muted">
            This email is from your account
          </p>
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Phone</label>
          <input
            className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-medium">Address *</label>
          <input
            className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.address1}
            onChange={(e) => onChange('address1', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">City *</label>
          <input
            className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.city}
            onChange={(e) => onChange('city', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">State *</label>
          <input
            className="w-full px-3 py-2 bg-white border rounded-md theme-border focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            required
          />
        </div>
      </div>

      <button
        className="w-full mt-6 rounded-md btn-primary h-11 disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!canContinue}
        onClick={(e) => {
          e.preventDefault();
          if (!canContinue) return;
          onContinue();
        }}
      >
        Continue to Payment
      </button>
    </div>
  );
}
