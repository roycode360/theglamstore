import { Link } from 'react-router-dom';

export default function OrderConfirmation() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl text-gray-700">
        ✓
      </div>
      <h1 className="text-3xl font-bold">Order Received</h1>
      <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
        Thank you! We have received your order. If you paid by bank transfer, we
        will verify your payment shortly.
      </p>
      <div className="mt-6">
        <Link
          to="/products"
          className="btn-primary inline-block rounded-md px-4 py-2"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
