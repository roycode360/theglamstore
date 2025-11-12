export function ProductAccordions() {
  return (
    <section className="bg-white border divide-y rounded-md theme-border">
      {[
        {
          k: 'When will my order ship?',
          d: 'Orders typically leave our warehouse within 24–48 hours on business days. You will receive an email once your package has been dispatched.',
        },
        {
          k: 'How do I track delivery progress?',
          d: 'Open your account dashboard and head to Orders to see the live status of each purchase, including tracking updates.',
        },
        {
          k: 'Can I update delivery details?',
          d: 'If your order is still Processing, contact support immediately with the correct delivery location or recipient details and we will update it for you.',
        },
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
