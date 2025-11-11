export function ProductAccordions() {
  return (
    <section className="theme-border divide-y rounded-md border bg-white">
      {[
        {
          k: 'Full Description',
          d: 'No description available.',
        },
        {
          k: 'Materials & Care',
          d: 'Premium materials. Dry clean recommended.',
        },
        { k: 'Shipping', d: 'Ships within 3-5 business days.' },
        { k: 'Returns', d: '30-day return policy.' },
      ].map((item, i) => (
        <details key={i} className="group">
          <summary className="flex cursor-pointer items-center justify-between px-4 py-3">
            <span className="font-medium">{item.k}</span>
            <span className="opacity-60">▾</span>
          </summary>
          <div
            className="px-4 pb-4 text-sm"
            style={{ color: 'rgb(var(--muted))' }}
          >
            {item.d}
          </div>
        </details>
      ))}
    </section>
  );
}
