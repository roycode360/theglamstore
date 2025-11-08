import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GET_ORDER } from '../../graphql/orders';
import Spinner from '../../components/ui/Spinner';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import brandLogo from '../../assets/images/logo.png';
import { GET_COMPANY_SETTINGS } from '../../graphql/settings';

export default function AdminOrderReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const { data, loading, error } = useQuery(GET_ORDER, {
    variables: { id: id ?? '' },
    skip: !id,
  });
  const { data: companyData } = useQuery(GET_COMPANY_SETTINGS, {
    fetchPolicy: 'cache-first',
  });

  useEffect(() => {
    if (data?.getOrder) {
      const num = data.getOrder.orderNumber?.trim()?.length
        ? data.getOrder.orderNumber
        : String(data.getOrder._id);
      document.title = `Invoice · ${num}`;
    }
  }, [data]);

  useEffect(() => {
    if (!loading && data?.getOrder && searchParams.get('print') === '1') {
      const timeout = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [loading, data, searchParams]);

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="rounded-lg border border-rose-200 bg-white px-6 py-4 text-sm text-rose-600 shadow-sm">
          Missing order ID in URL.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <Spinner label="Loading receipt" />
      </div>
    );
  }

  if (error || !data?.getOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100">
        <div className="rounded-lg border border-rose-200 bg-white px-6 py-4 text-sm text-rose-600 shadow-sm">
          Unable to load order details.
        </div>
      </div>
    );
  }

  const order = data.getOrder as {
    _id: string;
    orderNumber?: string | null;
    createdAt: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address1: string;
    city: string;
    state: string;
    subtotal: number;
    total: number;
    couponCode?: string | null;
    couponDiscount?: number | null;
    paymentMethod: string;
    status: string;
    transferProofUrl?: string | null;
    amountPaid?: number | null;
    balanceDue?: number | null;
    items: Array<{
      productId: string;
      name?: string | null;
      price?: number | null;
      quantity?: number | null;
      selectedSize?: string | null;
      selectedColor?: string | null;
    }>;
  };

  const settings = companyData?.companySettings;
  const company = {
    businessName: settings?.businessName?.trim() || 'TheGlamStore Limited',
    email: settings?.contactEmail?.trim() || 'support@theglamstore.ng',
    phone: settings?.contactPhone?.trim() || '+234 000 000 0000',
    address: settings?.address?.trim() || 'Lagos, Nigeria',
  };

  const displayOrderNumber =
    (order.orderNumber && order.orderNumber.trim()) ||
    order._id.slice(-8).toUpperCase();
  const createdDate = formatDate(order.createdAt);
  const amountPaid = order.amountPaid ?? 0;
  const balanceDue = order.balanceDue ?? Math.max(order.total - amountPaid, 0);
  const discount = order.couponDiscount ?? 0;

  return (
    <div className="min-h-screen bg-neutral-100 py-12 print:bg-white print:py-6">
      <style>
        {`
          @page { size: A4; margin: 16mm; }
          body { -webkit-print-color-adjust: exact; }
          a[href]:after { content: '' !important; }
        `}
      </style>
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-10 shadow-xl print:max-w-none print:border print:border-neutral-200 print:p-10 print:shadow-none">
        <header className="flex flex-col gap-6 border-b border-neutral-200 pb-6 md:flex-row md:items-center md:justify-between">
          <img
            src={brandLogo}
            alt={company.businessName}
            className="-mb-5 w-48 object-contain"
          />
          <div className="flex items-center">
            <div>
              <div className="mt-1 text-xs leading-5 text-neutral-500">
                <div>{company.address}</div>
                <div>{company.email}</div>
                <div>{company.phone}</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
            <div className="flex items-center justify-between gap-6">
              <span className="font-semibold text-neutral-400">Invoice #</span>
              <span className="font-mono text-neutral-900">
                {displayOrderNumber}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span className="font-semibold text-neutral-400">Date</span>
              <span>{createdDate}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-6">
              <span className="font-semibold text-neutral-400">Status</span>
              <span className="capitalize text-emerald-600">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 text-sm text-neutral-700 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Bill to
            </h2>
            <div className="mt-3 space-y-1 text-neutral-800">
              <div className="font-medium text-neutral-900">
                {order.firstName} {order.lastName}
              </div>
              <div>{order.email}</div>
              {order.phone ? <div>{order.phone}</div> : null}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Shipping address
            </h2>
            <div className="mt-3 space-y-1 text-neutral-800">
              <div>{order.address1}</div>
              <div>
                {order.city}, {order.state}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 text-sm text-neutral-700 md:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Payment summary
            </h2>
            <div className="mt-3 space-y-2 text-neutral-800">
              <div>
                Method:{' '}
                <span className="font-medium capitalize">
                  {order.paymentMethod.replace('_', ' ')}
                </span>
              </div>
              <div>
                Amount paid:{' '}
                <span className="font-medium">
                  {formatCurrency(amountPaid)}
                </span>
              </div>
              <div className={balanceDue > 0 ? 'text-amber-600' : undefined}>
                Balance due:{' '}
                <span className="font-medium">
                  {formatCurrency(balanceDue)}
                </span>
              </div>
              {order.transferProofUrl ? (
                <div>
                  Proof of payment:{' '}
                  <a
                    href={order.transferProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand font-medium print:text-neutral-900"
                  >
                    Click here
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Order summary
            </h2>
            <div className="mt-3 space-y-2 text-neutral-800">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {discount > 0 ? (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-lg font-semibold text-neutral-900">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Order items
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
            <table className="w-full border-collapse text-sm text-neutral-800">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Item description</th>
                  <th className="px-4 py-3 text-left">Options</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const quantity = item.quantity ?? 0;
                  const unit = item.price ?? 0;
                  const lineTotal = quantity * unit;
                  return (
                    <tr
                      key={`${item.productId}-${idx}`}
                      className="border-t border-neutral-100"
                    >
                      <td className="px-4 py-4 font-medium text-neutral-900">
                        {item.name ?? 'Item'}
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-500">
                        Size: {item.selectedSize || '—'} · Color:{' '}
                        {item.selectedColor || '—'}
                      </td>
                      <td className="px-4 py-4 text-right">{quantity}</td>
                      <td className="px-4 py-4 text-right">
                        {formatCurrency(unit)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-neutral-900">
                        {formatCurrency(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center text-xs text-neutral-500">
          Thank you for choosing {company.businessName}. For questions, contact
          us at {company.email}.
        </footer>
      </div>
    </div>
  );
}
