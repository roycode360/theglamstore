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

interface CheckoutShippingFormProps {
  values: CheckoutFormValues;
  onChange: <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K],
  ) => void;
  onContinue: () => void;
}

export default function CheckoutShippingForm({
  values,
  onChange,
  onContinue,
}: CheckoutShippingFormProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">Shipping Information</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">First Name *</label>
          <input
            className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Last Name *</label>
          <input
            className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <input
            type="email"
            className="theme-border w-full rounded-md border bg-gray-50 px-3 py-2 text-gray-600 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.email}
            readOnly
            required
          />
          <p className="text-muted mt-1 text-xs">
            This email is from your account
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input
            className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Address *</label>
          <input
            className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.address1}
            onChange={(e) => onChange('address1', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">City *</label>
          <input
            className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.city}
            onChange={(e) => onChange('city', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">State *</label>
          <input
            className="theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            required
          />
        </div>
      </div>

      <button
        className="btn-primary mt-6 h-11 w-full rounded-md"
        onClick={(e) => {
          e.preventDefault();
          onContinue();
        }}
      >
        Continue to Payment
      </button>
    </div>
  );
}
