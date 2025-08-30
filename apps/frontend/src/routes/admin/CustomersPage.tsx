export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Customers</h1>
          <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>View and manage customer records.</p>
        </div>
        <button className="px-3 h-9 rounded-md btn-primary text-sm">+ Add Customer</button>
      </div>
      <div className="theme-card border theme-border rounded-lg p-6">
        <div className="text-sm" style={{ color: 'rgb(var(--muted))' }}>Customers list will appear here.</div>
      </div>
    </div>
  )
}


