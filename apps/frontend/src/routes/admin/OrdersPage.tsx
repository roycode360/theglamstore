export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Orders</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Track and fulfill customer orders.</p>
        </div>
        <button className="px-3 h-9 rounded-md btn-primary text-sm">+ Create Order</button>
      </div>
      <div className="theme-card border theme-border rounded-lg p-6">
        <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Orders list will appear here.</div>
      </div>
    </div>
  )
}


