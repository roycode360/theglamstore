export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
