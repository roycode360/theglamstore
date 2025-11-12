export function ProductAccordions() {
  return (
    <section className="bg-white border divide-y rounded-md theme-border">
      {[
        {
          k: 'Full Description',
          d: 'No description available.',
        },
        {
          k: 'Materials & Care',
          d: 'Premium materials. Dry clean recommended.',
        },
        { k: 'Delivery', d: 'Delivery available across Nigeria.' },
      ].map((item, i) => (
        <details key={i} className="group">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer">
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
