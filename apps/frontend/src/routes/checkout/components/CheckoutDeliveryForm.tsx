import React, { useMemo } from 'react';
import Select from '../../../components/ui/Select';
import { formatCurrency } from '../../../utils/currency';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  notes: string;
}

export type CheckoutFieldErrors = Partial<
  Record<keyof CheckoutFormValues | 'deliveryLocation', string>
>;

interface CheckoutDeliveryFormProps {
  values: CheckoutFormValues;
  onChange: <K extends keyof CheckoutFormValues>(
    key: K,
    value: CheckoutFormValues[K],
  ) => void;
  deliveries: Array<{ _id: string; name: string; price: number }>;
  selectedDeliveryId: string;
  onChangeDelivery: (id: string) => void;
  errors?: CheckoutFieldErrors;
}

export default function CheckoutDeliveryForm({
  values,
  onChange,
  deliveries,
  selectedDeliveryId,
  onChangeDelivery,
  errors,
}: CheckoutDeliveryFormProps) {
  const deliveryOptions = useMemo(
    () =>
      deliveries.map((d) => ({
        value: d._id,
        label: `${d.name} - ${formatCurrency(d.price)}`,
      })),
    [deliveries],
  );

  const baseInputClasses =
    'theme-border w-full rounded-md border bg-white px-3 py-2 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10';
  const getInputClass = (hasError?: boolean) =>
    `${baseInputClasses} ${
      hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''
    }`;
  const getHelperTextClass = (hasError?: boolean) =>
    hasError ? 'mt-1 text-xs text-red-600' : 'text-muted mt-1 text-xs';

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">Delivery Information</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">First Name *</label>
          <input
            className={getInputClass(!!errors?.firstName)}
            value={values.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            required
          />
          {errors?.firstName ? (
            <p className={getHelperTextClass(true)}>{errors.firstName}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Last Name *</label>
          <input
            className={getInputClass(!!errors?.lastName)}
            value={values.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            required
          />
          {errors?.lastName ? (
            <p className={getHelperTextClass(true)}>{errors.lastName}</p>
          ) : null}
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
          <label className="mb-1 block text-sm font-medium">Phone *</label>
          <input
            className={getInputClass(!!errors?.phone)}
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            required
          />
          {errors?.phone ? (
            <p className={getHelperTextClass(true)}>{errors.phone}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">Address *</label>
          <input
            className={getInputClass(!!errors?.address1)}
            value={values.address1}
            onChange={(e) => onChange('address1', e.target.value)}
            required
          />
          {errors?.address1 ? (
            <p className={getHelperTextClass(true)}>{errors.address1}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">City *</label>
          <input
            className={getInputClass(!!errors?.city)}
            value={values.city}
            onChange={(e) => onChange('city', e.target.value)}
            required
          />
          {errors?.city ? (
            <p className={getHelperTextClass(true)}>{errors.city}</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">State *</label>
          <input
            className={getInputClass(!!errors?.state)}
            value={values.state}
            onChange={(e) => onChange('state', e.target.value)}
            required
          />
          {errors?.state ? (
            <p className={getHelperTextClass(true)}>{errors.state}</p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Delivery Location *
          </label>
          <Select
            value={selectedDeliveryId}
            onChange={onChangeDelivery}
            options={deliveryOptions}
            placeholder="Select delivery location"
            disabled={deliveries.length === 0}
            buttonClassName={
              errors?.deliveryLocation
                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                : ''
            }
          />
          {errors?.deliveryLocation ? (
            <p className={getHelperTextClass(true)}>
              {errors.deliveryLocation}
            </p>
          ) : null}
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium">
            Additional Notes
          </label>
          <textarea
            className={getInputClass(false)}
            rows={3}
            value={values.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Share delivery instructions, access codes, preferred delivery times, etc."
          />
          <p className="text-muted mt-1 text-xs">
            Optional information to help our team fulfil your order.
          </p>
        </div>
      </div>
    </div>
  );
}
