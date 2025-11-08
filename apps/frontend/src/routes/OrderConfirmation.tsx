export default function OrderConfirmation() {
  return (
    <div className="max-w-3xl px-4 py-16 mx-auto text-center">
      <div className="flex items-center justify-center mx-auto mb-4 text-2xl text-gray-700 bg-gray-100 rounded-full h-14 w-14">
        ✓
      </div>
      <h1 className="text-3xl font-bold">Order Received</h1>
      <p className="mt-2 text-sm" style={{ color: 'rgb(var(--muted))' }}>
        Thank you! We have received your order. If you paid by bank transfer, we
        will verify your payment shortly.
      </p>
      <div className="mt-6">
        <a
          href="/products"
          className="inline-block px-4 py-2 rounded-md btn-primary"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}
